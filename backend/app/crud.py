from datetime import date
from typing import List, Optional, Tuple
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app import models, schemas
from app.core.security import get_password_hash


# --- User CRUD Operations ---

def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    """Retrieve a user by their unique email address (case-insensitive across all DB dialects)."""
    if not email:
        return None
    normalized_email = email.lower().strip()
    return db.query(models.User).filter(func.lower(models.User.email) == normalized_email).first()


def get_user_by_id(db: Session, user_id: int) -> Optional[models.User]:
    """Retrieve a user by their primary key ID."""
    return db.query(models.User).filter(models.User.id == user_id).first()


def create_user(db: Session, user_in: schemas.UserCreate) -> models.User:
    """Create a new user with a bcrypt-hashed password, safely handling race conditions with DB constraints."""
    hashed_pw = get_password_hash(user_in.password)
    normalized_email = user_in.email.lower().strip()
    db_user = models.User(
        name=user_in.name.strip(),
        email=normalized_email,
        password_hash=hashed_pw,
    )
    db.add(db_user)
    try:
        db.commit()
        db.refresh(db_user)
        return db_user
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered. Please login.",
        )



# --- Habit CRUD Operations ---

def create_habit(
    db: Session, habit_in: schemas.HabitCreate, user_id: int
) -> models.Habit:
    """Create a new habit associated with an authenticated user."""
    db_habit = models.Habit(
        name=habit_in.name.strip(),
        description=habit_in.description.strip() if habit_in.description else None,
        reminder_enabled=bool(habit_in.reminder_enabled),
        reminder_time=habit_in.reminder_time.strip() if habit_in.reminder_time else None,
        user_id=user_id,
    )
    db.add(db_habit)
    db.commit()
    db.refresh(db_habit)
    return db_habit


def get_habits(
    db: Session, user_id: int, skip: int = 0, limit: int = 100
) -> List[models.Habit]:
    """Retrieve all habits belonging to a specific authenticated user."""
    return (
        db.query(models.Habit)
        .filter(models.Habit.user_id == user_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_habit_by_id(
    db: Session, habit_id: int, user_id: Optional[int] = None
) -> Optional[models.Habit]:
    """
    Retrieve a single habit by ID. If user_id is provided, guarantees
    that only the habit's owner can retrieve it.
    """
    query = db.query(models.Habit).filter(models.Habit.id == habit_id)
    if user_id is not None:
        query = query.filter(models.Habit.user_id == user_id)
    return query.first()


def update_habit(
    db: Session, db_habit: models.Habit, habit_update: schemas.HabitUpdate
) -> models.Habit:
    """Update an existing habit's name, description, or reminder settings."""
    if habit_update.name is not None:
        db_habit.name = habit_update.name.strip()
    if habit_update.description is not None:
        db_habit.description = habit_update.description.strip() if habit_update.description else None
    if habit_update.reminder_enabled is not None:
        db_habit.reminder_enabled = bool(habit_update.reminder_enabled)
    if habit_update.reminder_time is not None:
        db_habit.reminder_time = habit_update.reminder_time.strip() if habit_update.reminder_time else None

    db.commit()
    db.refresh(db_habit)
    return db_habit


def delete_habit(db: Session, db_habit: models.Habit) -> None:
    """Delete a habit and automatically cascade delete its daily records."""
    db.delete(db_habit)
    db.commit()


# --- Habit Record CRUD Operations ---

def upsert_habit_record(
    db: Session, habit_id: int, record_in: schemas.HabitRecordCreate
) -> Tuple[models.HabitRecord, bool]:
    """
    Create or update a daily record for a habit.
    If a record already exists for the habit on the specified date, update its completed status.
    Otherwise, create a new record.
    Returns: (record_model, is_created_boolean)
    """
    existing_record = (
        db.query(models.HabitRecord)
        .filter(
            models.HabitRecord.habit_id == habit_id,
            models.HabitRecord.record_date == record_in.record_date,
        )
        .first()
    )

    if existing_record:
        existing_record.completed = record_in.completed
        db.commit()
        db.refresh(existing_record)
        return existing_record, False
    else:
        new_record = models.HabitRecord(
            habit_id=habit_id,
            record_date=record_in.record_date,
            completed=record_in.completed,
        )
        db.add(new_record)
        db.commit()
        db.refresh(new_record)
        return new_record, True


def get_records_for_habit(
    db: Session, habit_id: int, skip: int = 0, limit: int = 500
) -> List[models.HabitRecord]:
    """Retrieve all daily completion records for a specific habit ordered by date descending."""
    return (
        db.query(models.HabitRecord)
        .filter(models.HabitRecord.habit_id == habit_id)
        .order_by(models.HabitRecord.record_date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_records_by_date(
    db: Session, target_date: date, user_id: int
) -> List[models.HabitRecord]:
    """Retrieve all habit records for a specific calendar date belonging only to the user's habits."""
    return (
        db.query(models.HabitRecord)
        .join(models.Habit, models.HabitRecord.habit_id == models.Habit.id)
        .filter(
            models.Habit.user_id == user_id,
            models.HabitRecord.record_date == target_date,
        )
        .all()
    )


def get_records_between_dates(
    db: Session,
    start_date: date,
    end_date: date,
    user_id: int,
    habit_id: Optional[int] = None,
) -> List[models.HabitRecord]:
    """
    Retrieve habit records between two dates inclusive, restricted to the user's habits,
    and optionally filtered by a specific habit ID.
    """
    query = (
        db.query(models.HabitRecord)
        .join(models.Habit, models.HabitRecord.habit_id == models.Habit.id)
        .filter(
            models.Habit.user_id == user_id,
            models.HabitRecord.record_date >= start_date,
            models.HabitRecord.record_date <= end_date,
        )
    )
    if habit_id is not None:
        query = query.filter(models.HabitRecord.habit_id == habit_id)
    return query.order_by(models.HabitRecord.record_date.asc()).all()
