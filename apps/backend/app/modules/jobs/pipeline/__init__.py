"""Job import pipeline — validate, clean, deduplicate, normalize, persist."""

from pydantic import BaseModel, Field


class ImportSummary(BaseModel):
    """Result of a job import run. JSON-serializable for API responses (Phase 2.4+)."""

    source_name: str
    fetched_count: int = 0
    validated_count: int = 0
    cleaned_count: int = 0
    normalized_count: int = 0
    inserted_count: int = 0
    skipped_duplicate_count: int = 0
    failed_count: int = 0
    errors: list[str] = Field(default_factory=list)
    dry_run: bool = False
