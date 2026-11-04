from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from App.core.dependencies import get_current_user
from App.database.connection import get_db
from App.models.profile import Profile
from App.models.user import User
from App.schemas.profile import ProfileIn, ProfileOut

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("/me", response_model=ProfileOut)
def get_my_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Returns the logged-in user's profile, or 404 if they haven't created one yet."""
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not created yet.")
    return profile


@router.put("/me", response_model=ProfileOut)
def save_my_profile(
    data: ProfileIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Creates the profile the first time, and updates it after that."""
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if profile is None:
        profile = Profile(user_id=current_user.id)  # first save: create it
        db.add(profile)

    # Copy every field from the request into the table row
    for field, value in data.model_dump().items():
        setattr(profile, field, value)

    db.commit()  # updated_at changes automatically on update
    db.refresh(profile)
    return profile