"""CV Pydantic schemas — v2 style."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


# ── Shared base ───────────────────────────────────────────────────────────────


class CVBase(BaseModel):
    """Shared CV fields."""

    user_id: int
    original_file_path: str | None = None
    raw_text: str | None = None
    parsed_data: dict | None = None
    quality_score: float | None = None


# ── Write payloads ────────────────────────────────────────────────────────────


class CVCreate(BaseModel):
    """Payload for creating a new CV record."""

    original_file_path: str | None = None


class CVUpdate(BaseModel):
    """Partial update for an existing CV."""

    original_file_path: str | None = None
    raw_text: str | None = None
    parsed_data: dict | None = None
    quality_score: float | None = None


# ── Read responses ────────────────────────────────────────────────────────────


class CVResponse(BaseModel):
    """Single CV representation — safe for API responses."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    original_file_path: str | None
    raw_text: str | None
    parsed_data: dict | None
    quality_score: float | None
    created_at: datetime
    updated_at: datetime


class CVListResponse(BaseModel):
    """Paginated CV listing response."""

    items: list[CVResponse]
    total: int
    page: int
    limit: int
