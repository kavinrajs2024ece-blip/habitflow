import logging
from sqlalchemy import text, inspect
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

from app.core.security import get_password_hash

logger = logging.getLogger("habitflow.migration")


def run_migrations(engine: Engine) -> None:
    """
    Safely applies database migrations to ensure the multi-user
    schema is active without losing any existing habits or daily records.
    Compatible with both SQLite and PostgreSQL.
    """
    with engine.connect() as conn:
        inspector = inspect(conn)

        # 1. Check if habits table exists
        if not inspector.has_table("habits"):
            # Table doesn't exist yet; Base.metadata.create_all will handle it
            return

        # 2. Inspect existing columns of the habits table
        column_names = [col["name"] for col in inspector.get_columns("habits")]


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

        # 5. Add reminder_enabled column if it doesn't exist yet
        if "reminder_enabled" not in column_names:
            logger.info("Migrating database: Adding 'reminder_enabled' column to 'habits' table...")
            conn.execute(
                text("ALTER TABLE habits ADD COLUMN reminder_enabled BOOLEAN DEFAULT FALSE;")
            )
            conn.commit()
            logger.info("Column 'reminder_enabled' successfully added to 'habits'.")

        # 6. Add reminder_time column if it doesn't exist yet
        if "reminder_time" not in column_names:
            logger.info("Migrating database: Adding 'reminder_time' column to 'habits' table...")
            conn.execute(
                text("ALTER TABLE habits ADD COLUMN reminder_time VARCHAR;")
            )
            conn.commit()
            logger.info("Column 'reminder_time' successfully added to 'habits'.")

        # 7. Check columns of the users table
        if inspector.has_table("users"):
            user_column_names = [col["name"] for col in inspector.get_columns("users")]

            if "daily_reminder_enabled" not in user_column_names:
                logger.info("Migrating database: Adding 'daily_reminder_enabled' to 'users' table...")
                conn.execute(
                    text("ALTER TABLE users ADD COLUMN daily_reminder_enabled BOOLEAN DEFAULT FALSE;")
                )
                conn.commit()
                logger.info("Column 'daily_reminder_enabled' successfully added to 'users'.")

            if "daily_reminder_time" not in user_column_names:
                logger.info("Migrating database: Adding 'daily_reminder_time' to 'users' table...")
                conn.execute(
                    text("ALTER TABLE users ADD COLUMN daily_reminder_time VARCHAR DEFAULT '20:00';")
                )
                conn.commit()
                logger.info("Column 'daily_reminder_time' successfully added to 'users'.")

