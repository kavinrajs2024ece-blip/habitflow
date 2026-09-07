from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.core.security import create_access_token, verify_password
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=schemas.UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Create a new user account with a name, valid email, and secure password.",
)
def register_user(
    user_in: schemas.UserCreate,
    db: Session = Depends(get_db),
):
    existing_user = crud.get_user_by_email(db, user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered. Please login.",
        )

    return crud.create_user(db=db, user_in=user_in)



@router.post(
    "/login",
    response_model=schemas.Token,
    status_code=status.HTTP_200_OK,
    summary="User Login (JSON Body)",
    description="Authenticate with email and password to receive a JWT access token.",
)
def login_user(
    credentials: schemas.UserLogin,
    db: Session = Depends(get_db),
):
    user = crud.get_user_by_email(db, credentials.email)
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Issue JWT token with user ID as subject
    access_token = create_access_token(data={"sub": str(user.id)})

    return schemas.Token(
        access_token=access_token,
        token_type="bearer",
        user=schemas.UserResponse.model_validate(user),
    )


@router.post(
    "/token",
    response_model=schemas.Token,
    status_code=status.HTTP_200_OK,
    include_in_schema=True,
    summary="OAuth2 Swagger Token Endpoint",
    description="OAuth2-compatible token endpoint for Swagger UI Authorize modal.",
)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = crud.get_user_by_email(db, form_data.username)
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": str(user.id)})

    return schemas.Token(
        access_token=access_token,
        token_type="bearer",
        user=schemas.UserResponse.model_validate(user),
    )


@router.get(
    "/me",
    response_model=schemas.UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current user profile",
    description="Retrieve the profile of the currently authenticated user.",
)
def get_me(
    current_user: models.User = Depends(get_current_user),
):
    return current_user


@router.put(
    "/me",
    response_model=schemas.UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Update current user profile",
    description="Update editable profile fields (name) for the currently authenticated user.",
)
def update_me(
    user_update: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if user_update.name is not None and user_update.name.strip():
        current_user.name = user_update.name.strip()
        db.commit()
        db.refresh(current_user)
    return current_user

