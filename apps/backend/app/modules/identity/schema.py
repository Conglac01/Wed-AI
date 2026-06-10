"""Identity Pydantic schemas — v2 style."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator

from app.modules.identity.constants import UserRole


# ------------------------------------------------------------------
# Internal (used by service / repository)
# ------------------------------------------------------------------


class UserCreateInternal(BaseModel):
    """Internal schema for creating a user — receives already-hashed password."""

    email: str
    password_hash: str
    full_name: str | None = None


class UserRead(BaseModel):
    """Public user representation. Never exposes password_hash or deleted_at."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str | None
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime


class UserUpdate(BaseModel):
    """Allowed user-updateable fields. Role/password changes are not allowed here."""

    full_name: str | None = None


# ------------------------------------------------------------------
# Auth requests
# ------------------------------------------------------------------


class UserRegisterRequest(BaseModel):
    """Public registration payload."""

    email: EmailStr
    password: str
    full_name: str | None = None

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class UserLoginRequest(BaseModel):
    """Login payload."""

    email: EmailStr
    password: str


class RefreshTokenRequest(BaseModel):
    """Refresh-token payload."""

    refresh_token: str


# ------------------------------------------------------------------
# Auth responses
# ------------------------------------------------------------------


class TokenResponse(BaseModel):
    """JWT token pair returned after login or refresh."""

    access_token: str
    refresh_token: str | None = None
    token_type: str = "bearer"
