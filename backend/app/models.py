from datetime import datetime, timezone
from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    """User model representing an account in HabitFlow."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # One-to-many relationship: A user can create many habits
    habits = relationship(
        "Habit",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class Habit(Base):
    """Habit model representing a daily habit to track."""

    __tablename__ = "habits"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationship back to User
    user = relationship("User", back_populates="habits")

    # One-to-many relationship: A habit can have multiple daily completion records
    records = relationship(
        "HabitRecord",
        back_populates="habit",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class HabitRecord(Base):
    """HabitRecord model representing daily completion logs for a habit."""

    __tablename__ = "habit_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    habit_id = Column(
        Integer,
        ForeignKey("habits.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    record_date = Column(Date, nullable=False, index=True)
    completed = Column(Boolean, default=False, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationship back to parent Habit
    habit = relationship("Habit", back_populates="records")

    # Constraint: Prevent duplicate records for the same habit on the same calendar date
    __table_args__ = (
        UniqueConstraint(
            "habit_id", "record_date", name="uix_habit_record_date"
        ),
    )
