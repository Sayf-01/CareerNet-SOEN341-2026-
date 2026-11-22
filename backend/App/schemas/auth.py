from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from App.models.user import UserRole


class RegisterRequest(BaseModel):
    """What the frontend must send to POST /auth/register."""

    full_name: str = Field(min_length=1, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: UserRole

    @field_validator("full_name")
    @classmethod
    def full_name_not_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Full name is required")
        return value


class UserOut(BaseModel):
    """The user fields we send back. Never includes the password."""

    model_config = ConfigDict(from_attributes=True)  # lets us build it from a SQLAlchemy User

    id: int
    full_name: str
    email: EmailStr
    role: UserRole


class RegisterResponse(BaseModel):
    message: str
    user: UserOut

# ---------- Login (Youssef) ----------

class LoginRequest(BaseModel):
    """What the frontend sends to POST /auth/login."""

    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    """What the backend returns after a successful login."""

    access_token: str
    token_type: str = "bearer"
    user: UserOut