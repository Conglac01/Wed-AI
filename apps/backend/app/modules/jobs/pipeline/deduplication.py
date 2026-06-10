"""Deduplication stage — in-memory + database duplicate detection."""

from dataclasses import dataclass, field

from app.modules.jobs.schema import JobCreate


@dataclass
class DedupResult:
    unique: list[JobCreate] = field(default_factory=list)
    duplicate_count: int = 0


# ------------------------------------------------------------------
# In-memory deduplication (within batch)
# ------------------------------------------------------------------


def _dedup_key(job: JobCreate) -> tuple[str, str, str]:
    return (
        (job.title or "").strip().lower(),
        (job.company_name or "").strip().lower(),
        (job.location or "").strip().lower(),
    )


def deduplicate_in_batch(jobs: list[JobCreate]) -> DedupResult:
    """Remove duplicates within a single batch. Preserves first occurrence."""
    seen: set[tuple[str, str, str]] = set()
    unique: list[JobCreate] = []
    dupes = 0

    for job in jobs:
        key = _dedup_key(job)
        if key in seen:
            dupes += 1
        else:
            seen.add(key)
            unique.append(job)

    return DedupResult(unique=unique, duplicate_count=dupes)


# ------------------------------------------------------------------
# Database-aware deduplication (used during import)
# ------------------------------------------------------------------


def filter_db_duplicates(
    jobs: list[JobCreate],
    repo,  # JobRepository (accepts .exists_active_duplicate(title, company, location))
) -> tuple[list[JobCreate], int]:
    """Filter out jobs that already exist as active rows in the database.

    Returns (new_jobs, skipped_count).
    """
    new: list[JobCreate] = []
    skipped = 0
    for job in jobs:
        if repo.exists_active_duplicate(
            job.title or "",
            job.company_name or "",
            job.location or "",
        ):
            skipped += 1
        else:
            new.append(job)
    return new, skipped
