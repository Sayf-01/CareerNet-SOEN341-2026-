from datetime import datetime, timedelta, timezone
import os

import jwt
from dotenv import load_dotenv
from pwdlib import PasswordHash
password_hash = PasswordHash.recommended()  # Argon2


def hash_password(plain_password: str) -> str:
    """Used during registration: turns the new user's password into a hash that is safe to store."""
    return password_hash.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Used during login: checks the typed password against the stored hash (True = correct)."""
    return password_hash.verify(plain_password, hashed_password)

# ---------- Login (Youssef) ----------
# JWT configuration
load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
)

def create_access_token(user_id: int) -> str:
    """Creates a JWT access token for a successfully logged-in user."""

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(user_id),
        "exp": expire,
    }

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)