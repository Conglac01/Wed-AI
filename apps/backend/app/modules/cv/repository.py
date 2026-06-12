"""CVRepository — database access layer. No business logic."""

from datetime import datetime

from sqlalchemy.orm import Session

from app.core.errors import NotFoundError
from app.modules.cv.model import CV
from app.modules.cv.schema import CVCreate, CVUpdate


class CVRepository:
    """Data access for the cvs table."""

    def __init__(self, db: Session):
        self.db = db

    # ── Read ──────────────────────────────────────────────────────────────────

    def get_by_id(self, cv_id: int) -> CV | None:
        """Return a non-deleted CV by primary key, or None."""
        return (
            self.db.query(CV)
            .filter(
                CV.id == cv_id,
                CV.deleted_at == None,  # noqa: E711
            )
            .first()
        )

    def list_by_user(
        self, user_id: int, *, page: int = 1, limit: int = 20
    ) -> tuple[list[CV], int]:
        """Return a page of non-deleted CVs for the given user, plus total count."""
        base = self.db.query(CV).filter(
            CV.user_id == user_id,
            CV.deleted_at == None,  # noqa: E711
        )

        total = base.count()
        offset = (page - 1) * limit
        rows = (
            base.order_by(CV.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )
        return rows, total

    # ── Write ─────────────────────────────────────────────────────────────────

    def create(self, data: CVCreate, *, user_id: int) -> CV:
        """Insert a new CV row for the given user."""
        cv = CV(
            user_id=user_id,
            original_file_path=data.original_file_path,
        )
        self.db.add(cv)
        self.db.commit()
        self.db.refresh(cv)
        return cv

    def update(self, cv_id: int, data: CVUpdate) -> CV:
        """Update mutable fields on an existing CV. Raises NotFoundError."""
        cv = self.get_by_id(cv_id)
        if cv is None:
            raise NotFoundError(f"CV with id={cv_id} not found")

        for field_name in ("original_file_path", "raw_text", "parsed_data", "quality_score"):
            value = getattr(data, field_name)
            if value is not None:
                setattr(cv, field_name, value)

        self.db.commit()
        self.db.refresh(cv)
        return cv

    def soft_delete(self, cv_id: int) -> CV:
        """Mark a CV as deleted. Raises NotFoundError."""
        cv = self.get_by_id(cv_id)
        if cv is None:
            raise NotFoundError(f"CV with id={cv_id} not found")

        cv.deleted_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(cv)
        return cv
