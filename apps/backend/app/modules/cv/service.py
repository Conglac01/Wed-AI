"""CVService — business logic layer."""

from sqlalchemy.orm import Session

from app.modules.cv.repository import CVRepository
from app.modules.cv.schema import CVCreate, CVListResponse, CVResponse, CVUpdate


class CVService:
    """CV domain logic. Delegates persistence to CVRepository."""

    def __init__(self, db: Session):
        self.repo = CVRepository(db)

    # ── Read ──────────────────────────────────────────────────────────────────

    def get_cv(self, cv_id: int, *, user_id: int) -> CVResponse | None:
        """Return a single CV if it belongs to the given user."""
        cv = self.repo.get_by_id(cv_id)
        if cv is None:
            return None
        if cv.user_id != user_id:
            return None
        return CVResponse.model_validate(cv)

    def list_user_cvs(
        self, user_id: int, *, page: int = 1, limit: int = 20
    ) -> CVListResponse:
        """Return a paginated list of CVs for the given user."""
        rows, total = self.repo.list_by_user(user_id, page=page, limit=limit)
        items = [CVResponse.model_validate(r) for r in rows]
        return CVListResponse(items=items, total=total, page=page, limit=limit)

    # ── Write ─────────────────────────────────────────────────────────────────

    def create_cv_record(self, user_id: int, data: CVCreate) -> CVResponse:
        """Create a new CV record for the given user."""
        cv = self.repo.create(data, user_id=user_id)
        return CVResponse.model_validate(cv)

    def update_cv_record(self, cv_id: int, user_id: int, data: CVUpdate) -> CVResponse:
        """Update an existing CV. Ensures ownership before writing."""
        cv = self.repo.get_by_id(cv_id)
        if cv is None or cv.user_id != user_id:
            raise ValueError("CV not found")
        updated = self.repo.update(cv_id, data)
        return CVResponse.model_validate(updated)

    def delete_cv_record(self, cv_id: int, user_id: int) -> None:
        """Soft-delete a CV. Ensures ownership before deleting."""
        cv = self.repo.get_by_id(cv_id)
        if cv is None or cv.user_id != user_id:
            raise ValueError("CV not found")
        self.repo.soft_delete(cv_id)
