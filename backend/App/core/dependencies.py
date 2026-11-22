import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from App.core.security import ALGORITHM, SECRET_KEY
from App.database.connection import get_db
from App.models.user import User, UserRole

# The one login helper for the whole backend (KA-9).
# Reads the "Authorization: Bearer <token>" header and adds the "Authorize" button on /docs.
# auto_error=False: we answer a missing header ourselves, with the same message as a bad token.
bearer_scheme = HTTPBearer(auto_error=False)

NOT_LOGGED_IN = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Not logged in.",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Finds out who is logged in from their login token.

    Any endpoint that needs a logged-in user adds:
        current_user: User = Depends(get_current_user)
    No token, a wrong header, a fake or expired token, or a deleted user -> 401 "Not logged in."
    """
    if credentials is None:  # no header, or not "Bearer ..."
        raise NOT_LOGGED_IN

    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload["sub"])  # login put the user's id in "sub"
    except (jwt.PyJWTError, KeyError, ValueError, TypeError):
        raise NOT_LOGGED_IN

    user = db.get(User, user_id)
    if user is None:  # the account was deleted after the token was made
        raise NOT_LOGGED_IN
    return user


def require_recruiter(current_user: User = Depends(get_current_user)) -> User:
    """Allows only logged-in recruiters. A job seeker gets 403."""
    if current_user.role != UserRole.RECRUITER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Recruiter access required",
        )
    return current_user