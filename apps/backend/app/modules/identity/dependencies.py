"""FastAPI dependencies for authentication."""

from fastapi import Depends, Header
from fastapi.exceptions import HTTPException
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.db.session import get_db
from app.modules.identity.schema import UserRead
from app.modules.identity.service import UserService


def get_current_user(
    authorization: str = Header(..., alias="Authorization"),
    db: Session = Depends(get_db),
) -> UserRead:
    """Extract and validate the Bearer token, returning the current user.

    Raises HTTP 401 on any token or user validation failure.
    """
    # 1. Parse Bearer header
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    token = parts[1]
    if not token:
        raise HTTPException(status_code=401, detail="Invalid token")

    # 2. Decode JWT — decode_token raises ValueError on failure
    try:
        payload = decode_token(token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

    # 3. Must be an access token
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token")

    sub = payload.get("sub")
    if sub is None:
        raise HTTPException(status_code=401, detail="Invalid token")

    # 4. Load user
    service = UserService(db)
    try:
        return service.get_current_user_by_id(int(sub))
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
