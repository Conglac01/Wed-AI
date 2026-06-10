"""Password hashing and JWT utilities."""

from datetime import datetime, timedelta, timezone

from jwt import ExpiredSignatureError, InvalidTokenError

import jwt
from passlib.context import CryptContext

from app.core.config import settings

# ------------------------------------------------------------------
# Password hashing
# ------------------------------------------------------------------

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    """Hash a plain-text password using bcrypt."""
    return _pwd_context.hash(plain_password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    """Verify a plain-text password against a stored bcrypt hash."""
    return _pwd_context.verify(plain_password, password_hash)


# ------------------------------------------------------------------
# JWT
# ------------------------------------------------------------------


def _create_token(
    subject: str | int,
    token_type: str,
    expires_delta: timedelta | None,
) -> str:
    """Build and sign a JWT with {sub, type, exp, iat}."""
    now = datetime.now(timezone.utc)
    payload: dict = {
        "sub": str(subject),
        "type": token_type,
        "iat": now,
        "exp": now + (expires_delta or timedelta(minutes=15)),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_access_token(
    subject: str | int,
    expires_minutes: int | None = None,
) -> str:
    """Create an access token for the given subject."""
    minutes = expires_minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES
    return _create_token(subject, "access", timedelta(minutes=minutes))


def create_refresh_token(
    subject: str | int,
    expires_days: int | None = None,
) -> str:
    """Create a refresh token for the given subject."""
    days = expires_days or settings.REFRESH_TOKEN_EXPIRE_DAYS
    return _create_token(subject, "refresh", timedelta(days=days))


def decode_token(token: str) -> dict:
    """Decode and validate a JWT. Returns the payload dict.

    Raises:
        ValueError: If the token is expired or invalid.
    """
    try:
        return jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
    except ExpiredSignatureError:
        raise ValueError("Token expired")
    except InvalidTokenError:
        raise ValueError("Invalid token")
