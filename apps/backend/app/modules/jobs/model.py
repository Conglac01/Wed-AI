"""Job model."""

from sqlalchemy import Boolean, Float, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.shared.base_entity import BaseEntity


class Job(BaseEntity, Base):
    """Job listing for ViecConnect IT Jobs."""

    __tablename__ = "jobs"

    # --- Required ---
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    # --- Optional metadata ---
    company_logo_url: Mapped[str | None] = mapped_column(
        String(1024), default=None, nullable=True
    )
    salary_text: Mapped[str | None] = mapped_column(
        String(255), default=None, nullable=True
    )
    salary_min: Mapped[int | None] = mapped_column(
        Integer, default=None, nullable=True
    )
    salary_max: Mapped[int | None] = mapped_column(
        Integer, default=None, nullable=True
    )
    skills: Mapped[list | None] = mapped_column(JSONB, default=None, nullable=True)
    requirements: Mapped[str | None] = mapped_column(
        Text, default=None, nullable=True
    )
    benefits: Mapped[str | None] = mapped_column(
        Text, default=None, nullable=True
    )
    deadline: Mapped[str | None] = mapped_column(
        String(50), default=None, nullable=True
    )

    # --- Source tracking ---
    source_name: Mapped[str | None] = mapped_column(
        String(100), default=None, nullable=True
    )
    source_url: Mapped[str | None] = mapped_column(
        String(1024), default=None, nullable=True
    )

    # --- Quality & status ---
    quality_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
