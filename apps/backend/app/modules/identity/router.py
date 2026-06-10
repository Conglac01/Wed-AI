"""Auth router — register, login, refresh, current user."""

from fastapi import APIRouter, Depends
from fastapi.exceptions import HTTPException
from sqlalchemy.orm import Session

from app.core.security import create_access_token, create_refresh_token
from app.db.session import get_db
from app.modules.identity.dependencies import get_current_user
from app.modules.identity.schema import (
    RefreshTokenRequest,
    TokenResponse,
    UserLoginRequest,
    UserRead,
    UserRegisterRequest,
)
from app.modules.identity.service import UserService

router = APIRouter(prefix="/auth", tags=["Auth"])


def _svc(db: Session) -> UserService:
    return UserService(db)


# ------------------------------------------------------------------
# Error mapping: ValueError → HTTPException
# ------------------------------------------------------------------

_ERROR_MAP: dict[str, int] = {
    "Email already registered": 400,
    "Password must be at least 8 characters": 400,
    "Invalid email or password": 401,
    "User is inactive": 401,
    "Invalid refresh token": 401,
    "Token expired": 401,
    "Invalid token": 401,
    "User not found": 401,
}


def _http_exc(exc: ValueError) -> HTTPException:
    msg = str(exc)
    status = _ERROR_MAP.get(msg, 400)
    return HTTPException(status_code=status, detail=msg)


# ------------------------------------------------------------------
# Endpoints
# ------------------------------------------------------------------


@router.post("/register", status_code=201, response_model=UserRead)
def register(body: UserRegisterRequest, db: Session = Depends(get_db)):
    """Register a new user account."""
    try:
        return _svc(db).register_user(body)
    except ValueError as e:
        raise _http_exc(e)


@router.post("/login", status_code=200, response_model=TokenResponse)
def login(body: UserLoginRequest, db: Session = Depends(get_db)):
    """Authenticate and return a JWT token pair."""
    try:
        user = _svc(db).authenticate_user(body)
    except ValueError as e:
        raise _http_exc(e)

    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", status_code=200, response_model=TokenResponse)
def refresh(body: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Issue a new access token using a valid refresh token."""
    try:
        return _svc(db).refresh_access_token(body)
    except ValueError as e:
        raise _http_exc(e)


@router.get("/me", status_code=200, response_model=UserRead)
def me(current_user: UserRead = Depends(get_current_user)):
    """Return the currently authenticated user."""
    return current_user

