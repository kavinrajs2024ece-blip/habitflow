import os
from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Database file URL (habitflow.db created in the backend root directory)
SQLALCHEMY_DATABASE_URL = "sqlite:///./habitflow.db"

# Create SQLite Engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
)


# Enforce SQLite foreign key constraints on connection
@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


# Database Session Factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative Base for ORM Models
Base = declarative_base()


# Dependency generator for API endpoints
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
