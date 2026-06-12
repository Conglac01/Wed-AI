"""CV model — stores uploaded CVs for analysis and matching."""

from sqlalchemy import Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.shared.base_entity import BaseEntity


class CV(BaseEntity, Base):
    """A user-uploaded CV for AI analysis and job matching.

    One user may own multiple CVs (not one-CV-per-user).
    """

    __tablename__ = "cvs"

    # ── Ownership ─────────────────────────────────────────────
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    # ── File metadata (not yet implemented — Phase 3.2+) ─────
    original_file_path: Mapped[str | None] = mapped_column(
        String(1024), default=None, nullable=True
    )

    # ── Extracted content (not yet implemented — Phase 3.3+) ─
    raw_text: Mapped[str | None] = mapped_column(
        Text, default=None, nullable=True
    )
    parsed_data: Mapped[dict | None] = mapped_column(
        JSONB, default=None, nullable=True
    )

    # ── Quality & status ──────────────────────────────────────
    quality_score: Mapped[float | None] = mapped_column(
        Float, default=None, nullable=True
    )
