from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from App.core.security import hash_password, verify_password, create_access_token
from App.database.connection import get_db
from App.models.user import User
from App.schemas.auth import (RegisterRequest, RegisterResponse, LoginRequest, LoginResponse, UserOut)
router = APIRouter(prefix="/auth", tags=["auth"])

DUPLICATE_EMAIL = "An account with this email already exists."


# ---------- Registration (Lamees, BE05) ----------


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    email = data.email.lower()

    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=DUPLICATE_EMAIL)

    user = User(
        full_name=data.full_name,
        email=email,
        hashed_password=hash_password(data.password),
        role=data.role,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:  # two requests with the same email at the same moment
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=DUPLICATE_EMAIL)
    db.refresh(user)

    return RegisterResponse(message="Registration successful!", user=UserOut.model_validate(user))

# ---------- Login (Youssef) ----------

@router.post("/login", response_model=LoginResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    email = data.email.lower()

    # Find the user with this email
    user = db.query(User).filter(User.email == email).first()

    # Reject if the email doesn't exist or the password is incorrect
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    # Create a token for the authenticated user
    access_token = create_access_token(user.id)

    return LoginResponse(
        access_token=access_token,
        user=UserOut.model_validate(user),
    )