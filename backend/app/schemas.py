from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


# --- User Schemas ---

class UserBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Full name of the user")
    email: EmailStr = Field(..., description="Unique email address of the user")


class UserCreate(UserBase):
    password: str = Field(
        ..., min_length=6, max_length=128, description="Account password (minimum 6 characters)"
    )


class UserLogin(BaseModel):
    email: EmailStr = Field(..., description="Registered email address")
    password: str = Field(..., min_length=1, description="Account password")


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="Updated full name of user")


class UserResponse(UserBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    user_id: Optional[int] = None


# --- Habit Schemas ---

class HabitBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Name of the habit")
    description: Optional[str] = Field(None, max_length=500, description="Optional description of the habit")
    reminder_enabled: Optional[bool] = Field(False, description="Whether daily reminder is enabled")
    reminder_time: Optional[str] = Field(None, max_length=10, description="Reminder time in HH:MM format")


class HabitCreate(HabitBase):
    pass


class HabitUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="Updated name of the habit")
    description: Optional[str] = Field(None, max_length=500, description="Updated description of the habit")
    reminder_enabled: Optional[bool] = Field(None, description="Whether daily reminder is enabled")
    reminder_time: Optional[str] = Field(None, max_length=10, description="Reminder time in HH:MM format")


class HabitResponse(HabitBase):
    id: int
    user_id: int
    reminder_enabled: bool = False
    reminder_time: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Habit Record Schemas ---

class HabitRecordBase(BaseModel):
    record_date: date = Field(..., description="Calendar date of the record (YYYY-MM-DD)")
    completed: bool = Field(False, description="Whether the habit was completed on this date")


class HabitRecordCreate(HabitRecordBase):
    pass


class HabitRecordUpdate(BaseModel):
    completed: bool = Field(..., description="Updated completion status")


class HabitRecordResponse(HabitRecordBase):
    id: int
    habit_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class HabitWithRecordsResponse(HabitResponse):
    records: List[HabitRecordResponse] = []

    model_config = ConfigDict(from_attributes=True)
