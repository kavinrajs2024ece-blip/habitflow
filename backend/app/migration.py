import logging
from sqlalchemy import text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

from app.core.security import get_password_hash

logger = logging.getLogger("habitflow.migration")


def run_migrations(engine: Engine) -> None:
    """
    Safely applies SQLite database migrations to ensure the multi-user
    schema is active without losing any existing habits or daily records.
    """
    with engine.connect() as conn:
        # 1. Check if habits table exists
        tables_res = conn.execute(
            text("SELECT name FROM sqlite_master WHERE type='table' AND name='habits';")
        ).fetchone()

        if not tables_res:
            # Table doesn't exist yet; Base.metadata.create_all will handle it
            return

        # 2. Inspect existing columns of the habits table
        columns_info = conn.execute(text("PRAGMA table_info(habits);")).fetchall()
        column_names = [col[1] for col in columns_info]

        # 3. Add user_id column if it doesn't exist yet
        if "user_id" not in column_names:
            logger.info("Migrating database: Adding 'user_id' column to 'habits' table...")
            conn.execute(
                text("ALTER TABLE habits ADD COLUMN user_id INTEGER REFERENCES users(id);")
            )
            conn.commit()
            logger.info("Column 'user_id' successfully added to 'habits'.")

        # 4. Check for existing habits without an assigned user_id
        unassigned_count = conn.execute(
            text("SELECT count(*) FROM habits WHERE user_id IS NULL;")
        ).fetchone()[0]

        if unassigned_count > 0:
            logger.info(
                f"Found {unassigned_count} existing habits without user assignment. Associating with demo user..."
            )
            # Check if default demo user exists
            demo_user = conn.execute(
                text("SELECT id FROM users WHERE email = 'demo@habitflow.com';")
            ).fetchone()

            if demo_user:
                demo_user_id = demo_user[0]
            else:
                default_password_hash = get_password_hash("password123")
                conn.execute(
                    text(
                        "INSERT INTO users (name, email, password_hash, created_at) "
                        "VALUES (:name, :email, :password_hash, CURRENT_TIMESTAMP);"
                    ),
                    {
                        "name": "HabitFlow User",
                        "email": "demo@habitflow.com",
                        "password_hash": default_password_hash,
                    },
                )
                conn.commit()
                demo_user = conn.execute(
                    text("SELECT id FROM users WHERE email = 'demo@habitflow.com';")
                ).fetchone()
                demo_user_id = demo_user[0]

            # Assign orphaned habits to the demo user
            conn.execute(
                text("UPDATE habits SET user_id = :user_id WHERE user_id IS NULL;"),
                {"user_id": demo_user_id},
            )
            conn.commit()
            logger.info(
                f"Successfully linked {unassigned_count} existing habits to user {demo_user_id} (demo@habitflow.com)."
            )
