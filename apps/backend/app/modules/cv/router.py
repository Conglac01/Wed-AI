"""CV router — authenticated CV CRUD endpoints."""

from fastapi import APIRouter, Depends, Query
from fastapi.exceptions import HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.cv.schema import CVCreate, CVListResponse, CVResponse, CVUpdate
from app.modules.cv.service import CVService
from app.modules.identity.dependencies import get_current_user
from app.modules.identity.schema import UserRead

router = APIRouter(prefix="/cv", tags=["CV"])


def _svc(db: Session) -> CVService:
    return CVService(db)


# ── POST /cv ──────────────────────────────────────────────────────────────────


@router.post("", status_code=201, response_model=CVResponse)
def create_cv(
    body: CVCreate,
    current_user: UserRead = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new CV record for the authenticated user."""
    return _svc(db).create_cv_record(user_id=current_user.id, data=body)


# ── GET /cv — list own CVs ───────────────────────────────────────────────────


@router.get("", response_model=CVListResponse)
def list_cvs(
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    limit: int = Query(20, ge=1, le=100, description="Items per page (max 100)"),
    current_user: UserRead = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return a paginated list of the authenticated user's CVs."""
    return _svc(db).list_user_cvs(current_user.id, page=page, limit=limit)


# ── GET /cv/{cv_id} — single CV ──────────────────────────────────────────────


@router.get("/{cv_id}", response_model=CVResponse)
def get_cv(
    cv_id: int,
    current_user: UserRead = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return a single CV by id. Only the owner can access it."""
    cv = _svc(db).get_cv(cv_id, user_id=current_user.id)
    if cv is None:
        raise HTTPException(status_code=404, detail="CV not found")
    return cv


# ── PATCH /cv/{cv_id} — update CV ───────────────────────────────────────────


@router.patch("/{cv_id}", response_model=CVResponse)
def update_cv(
    cv_id: int,
    body: CVUpdate,
    current_user: UserRead = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update an existing CV. Only the owner can update it."""
    try:
        return _svc(db).update_cv_record(cv_id, current_user.id, body)
    except ValueError:
        raise HTTPException(status_code=404, detail="CV not found")


# ── DELETE /cv/{cv_id} — soft-delete CV ──────────────────────────────────────


@router.delete("/{cv_id}", status_code=204)
def delete_cv(
    cv_id: int,
    current_user: UserRead = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Soft-delete a CV. Only the owner can delete it."""
    try:
        _svc(db).delete_cv_record(cv_id, current_user.id)
    except ValueError:
        raise HTTPException(status_code=404, detail="CV not found")
