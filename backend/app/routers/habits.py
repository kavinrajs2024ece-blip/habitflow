import calendar
from datetime import date, datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/habits", tags=["Habits"])


# --- Habit Endpoints ---

@router.post(
    "",
    response_model=schemas.HabitResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a habit",
    description="Create a new habit associated with the authenticated user.",
)
def create_habit(
    habit_in: schemas.HabitCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return crud.create_habit(db=db, habit_in=habit_in, user_id=current_user.id)


@router.get(
    "",
    response_model=List[schemas.HabitResponse],
    status_code=status.HTTP_200_OK,
    summary="Get all habits for current user",
    description="Retrieve all habits created by the currently authenticated user.",
)
def get_all_habits(
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return crud.get_habits(db=db, user_id=current_user.id, skip=skip, limit=limit)


@router.get(
    "/{habit_id}",
    response_model=schemas.HabitResponse,
    status_code=status.HTTP_200_OK,
    summary="Get a habit by ID",
    description="Retrieve details of a single habit owned by the authenticated user.",
)
def get_habit_by_id(
    habit_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    habit = crud.get_habit_by_id(db=db, habit_id=habit_id, user_id=current_user.id)
    if not habit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Habit with ID {habit_id} not found",
        )
    return habit


@router.put(
    "/{habit_id}",
    response_model=schemas.HabitResponse,
    status_code=status.HTTP_200_OK,
    summary="Update a habit",
    description="Update the name or description of an existing habit owned by the authenticated user.",
)
def update_habit(
    habit_id: int,
    habit_update: schemas.HabitUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    habit = crud.get_habit_by_id(db=db, habit_id=habit_id, user_id=current_user.id)
    if not habit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Habit with ID {habit_id} not found",
        )
    return crud.update_habit(db=db, db_habit=habit, habit_update=habit_update)


@router.delete(
    "/{habit_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a habit",
    description="Delete a habit and all of its associated daily records if owned by the authenticated user.",
)
def delete_habit(
    habit_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    habit = crud.get_habit_by_id(db=db, habit_id=habit_id, user_id=current_user.id)
    if not habit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Habit with ID {habit_id} not found",
        )
    crud.delete_habit(db=db, db_habit=habit)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# --- Daily Record Endpoints for a Habit ---

@router.post(
    "/{habit_id}/records",
    response_model=schemas.HabitRecordResponse,
    summary="Create or update a daily record for a habit",
    description=(
        "Log completion for a habit on a specific date. "
        "Guarantees that the habit exists and belongs to the authenticated user."
    ),
)
def upsert_habit_record(
    habit_id: int,
    record_in: schemas.HabitRecordCreate,
    response: Response,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    habit = crud.get_habit_by_id(db=db, habit_id=habit_id, user_id=current_user.id)
    if not habit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cannot record entry: Habit with ID {habit_id} does not exist or belongs to another user",
        )

    record, is_created = crud.upsert_habit_record(
        db=db, habit_id=habit_id, record_in=record_in
    )

    if is_created:
        response.status_code = status.HTTP_201_CREATED
    else:
        response.status_code = status.HTTP_200_OK

    return record


@router.get(
    "/{habit_id}/records",
    response_model=List[schemas.HabitRecordResponse],
    status_code=status.HTTP_200_OK,
    summary="Get all records for a habit",
    description="Retrieve all daily completion records for a specific habit owned by the authenticated user.",
)
def get_records_for_habit(
    habit_id: int,
    skip: int = 0,
    limit: int = 500,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    habit = crud.get_habit_by_id(db=db, habit_id=habit_id, user_id=current_user.id)
    if not habit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Habit with ID {habit_id} not found",
        )
    return crud.get_records_for_habit(db=db, habit_id=habit_id, skip=skip, limit=limit)


@router.get(
    "/{habit_id}/statistics",
    status_code=status.HTTP_200_OK,
    summary="Get individual habit statistics",
    description="Calculate individual weekly or monthly habit completion statistics using SQLite records.",
)
def get_habit_statistics(
    habit_id: int,
    period: str = "week",
    target_date: Optional[str] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    habit = crud.get_habit_by_id(db=db, habit_id=habit_id, user_id=current_user.id)
    if not habit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Habit with ID {habit_id} not found",
        )

    today = date.today()
    if target_date:
        try:
            ref_date = datetime.strptime(target_date.split("T")[0], "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid target_date format. Expected YYYY-MM-DD.",
            )
    else:
        ref_date = today

    # Fetch all actual records for this habit
    all_records = crud.get_records_for_habit(db=db, habit_id=habit_id, skip=0, limit=2000)
    completed_date_strings = set()
    for r in all_records:
        if r.completed:
            d_str = r.record_date.strftime("%Y-%m-%d") if hasattr(r.record_date, "strftime") else str(r.record_date).split("T")[0]
            completed_date_strings.add(d_str)

    # Calculate Current Streak
    today_str = today.strftime("%Y-%m-%d")
    current_streak = 0
    check_day = today

    if today_str in completed_date_strings:
        current_streak = 1
        check_day = today - timedelta(days=1)
    else:
        check_day = today - timedelta(days=1)
        if check_day.strftime("%Y-%m-%d") not in completed_date_strings:
            current_streak = 0
            check_day = None

    if check_day:
        while True:
            d_str = check_day.strftime("%Y-%m-%d")
            if d_str in completed_date_strings:
                current_streak += 1
                check_day -= timedelta(days=1)
            else:
                break

    # Calculate Best Streak
    best_streak = 0
    if completed_date_strings:
        sorted_dates = sorted([datetime.strptime(d, "%Y-%m-%d").date() for d in completed_date_strings])
        best_streak = 1
        current_run = 1
        for i in range(1, len(sorted_dates)):
            if (sorted_dates[i] - sorted_dates[i - 1]).days == 1:
                current_run += 1
                if current_run > best_streak:
                    best_streak = current_run
            elif (sorted_dates[i] - sorted_dates[i - 1]).days > 1:
                current_run = 1

    # Weekly period
    if period.lower() == "week":
        # Monday is start of week
        monday = ref_date - timedelta(days=ref_date.weekday())
        sunday = monday + timedelta(days=6)
        label = f"{monday.strftime('%b %d')} – {sunday.strftime('%b %d, %Y')}"

        days = []
        completed_days = 0
        eligible_days = 0

        for i in range(7):
            d = monday + timedelta(days=i)
            d_str = d.strftime("%Y-%m-%d")
            is_future = d > today
            is_completed = d_str in completed_date_strings

            if is_future:
                status_str = "future"
            elif is_completed:
                status_str = "completed"
                completed_days += 1
                eligible_days += 1
            else:
                status_str = "not_completed"
                eligible_days += 1

            days.append({
                "date": d_str,
                "day_name": d.strftime("%a"),
                "day_num": d.day,
                "status": status_str,
                "is_completed": is_completed,
                "is_future": is_future,
                "is_today": d == today,
            })

        not_completed_days = max(0, eligible_days - completed_days)
        percentage = round((completed_days / eligible_days) * 100) if eligible_days > 0 else 0

        return {
            "habit_id": habit_id,
            "habit_name": habit.name,
            "period": "week",
            "label": label,
            "start_date": monday.strftime("%Y-%m-%d"),
            "end_date": sunday.strftime("%Y-%m-%d"),
            "total_days": 7,
            "eligible_days": eligible_days,
            "completed_days": completed_days,
            "not_completed_days": not_completed_days,
            "completion_percentage": percentage,
            "current_streak": current_streak,
            "best_streak": best_streak,
            "days": days,
        }

    # Monthly period
    else:
        year = ref_date.year
        month = ref_date.month
        total_days_in_month = calendar.monthrange(year, month)[1]
        first_of_month = date(year, month, 1)
        label = first_of_month.strftime("%B %Y")

        is_current_month = (year == today.year and month == today.month)
        is_past_month = (year < today.year or (year == today.year and month < today.month))

        if is_current_month:
            eligible_days = today.day
        elif is_past_month:
            eligible_days = total_days_in_month
        else:
            eligible_days = 0

        completed_days = 0
        for day_num in range(1, total_days_in_month + 1):
            d = date(year, month, day_num)
            d_str = d.strftime("%Y-%m-%d")
            if d <= today and d_str in completed_date_strings:
                completed_days += 1

        not_completed_days = max(0, eligible_days - completed_days)
        percentage = round((completed_days / eligible_days) * 100) if eligible_days > 0 else 0

        return {
            "habit_id": habit_id,
            "habit_name": habit.name,
            "period": "month",
            "label": label,
            "year": year,
            "month": month,
            "total_days": total_days_in_month,
            "eligible_days": eligible_days,
            "completed_days": completed_days,
            "not_completed_days": not_completed_days,
            "completion_percentage": percentage,
            "current_streak": current_streak,
            "best_streak": best_streak,
        }
