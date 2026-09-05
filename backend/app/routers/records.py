from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/records", tags=["Records"])


@router.get(
    "/by-date/{record_date}",
    response_model=List[schemas.HabitRecordResponse],
    status_code=status.HTTP_200_OK,
    summary="Get records for a specific date",
    description="Retrieve all habit records logged on a specific calendar date across habits owned by current user.",
)
def get_records_by_date(
    record_date: date,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return crud.get_records_by_date(db=db, target_date=record_date, user_id=current_user.id)


@router.get(
    "/range",
    response_model=List[schemas.HabitRecordResponse],
    status_code=status.HTTP_200_OK,
    summary="Get all records between two dates",
    description="Retrieve habit completion records between two dates inclusive for habits owned by current user.",
)
def get_records_between_dates(
    start_date: date = Query(..., description="Start date (YYYY-MM-DD) inclusive"),
    end_date: date = Query(..., description="End date (YYYY-MM-DD) inclusive"),
    habit_id: Optional[int] = Query(None, description="Optional filter for a specific habit ID"),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid date range: start_date ({start_date}) cannot be after end_date ({end_date})",
        )

    if habit_id is not None:
        habit = crud.get_habit_by_id(db=db, habit_id=habit_id, user_id=current_user.id)
        if not habit:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Habit with ID {habit_id} not found or unauthorized",
            )

    return crud.get_records_between_dates(
        db=db,
        start_date=start_date,
        end_date=end_date,
        user_id=current_user.id,
        habit_id=habit_id,
    )


@router.get(
    "",
    response_model=List[schemas.HabitRecordResponse],
    status_code=status.HTTP_200_OK,
    summary="Query records with flexible filters",
    description=(
        "Query records by a specific date, or by a date range (start_date & end_date), "
        "restricted to habits owned by current user."
    ),
)
def query_records(
    record_date: Optional[date] = Query(None, alias="date", description="Filter for a specific date (YYYY-MM-DD)"),
    start_date: Optional[date] = Query(None, description="Range query start date (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Range query end date (YYYY-MM-DD)"),
    habit_id: Optional[int] = Query(None, description="Filter for a specific habit ID"),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Validate habit ownership if habit_id is passed
    if habit_id is not None:
        habit = crud.get_habit_by_id(db=db, habit_id=habit_id, user_id=current_user.id)
        if not habit:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Habit with ID {habit_id} not found or unauthorized",
            )

    # Case 1: Specific single date filter
    if record_date is not None:
        records = crud.get_records_by_date(db=db, target_date=record_date, user_id=current_user.id)
        if habit_id is not None:
            records = [r for r in records if r.habit_id == habit_id]
        return records

    # Case 2: Date range filter
    if start_date is not None or end_date is not None:
        if start_date is None or end_date is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Both 'start_date' and 'end_date' must be provided for a date range query",
            )
        if start_date > end_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"start_date ({start_date}) cannot be after end_date ({end_date})",
            )
        return crud.get_records_between_dates(
            db=db,
            start_date=start_date,
            end_date=end_date,
            user_id=current_user.id,
            habit_id=habit_id,
        )

    # Case 3: Only habit_id filter
    if habit_id is not None:
        return crud.get_records_for_habit(db=db, habit_id=habit_id)

    # Default: Return empty list if no query parameters supplied
    return []
