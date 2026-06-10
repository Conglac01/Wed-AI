"""Normalization stage — skills dedup/casing, salary types, location cleanup."""

from app.modules.jobs.schema import JobCreate


def _normalize_skills(skills: list[str] | None) -> list[str] | None:
    """Trim, remove empties, deduplicate case-insensitively keeping first casing."""
    if not skills:
        return None

    cleaned: list[str] = []
    for s in skills:
        t = s.strip()
        if t:
            cleaned.append(t)

    if not cleaned:
        return None

    seen: set[str] = set()
    deduped: list[str] = []
    for token in cleaned:
        key = token.lower()
        if key not in seen:
            seen.add(key)
            deduped.append(token)

    return deduped if deduped else None


def _normalize_location(loc: str) -> str:
    """Trim and collapse spaces in location string."""
    cleaned = loc.strip()
    while "  " in cleaned:
        cleaned = cleaned.replace("  ", " ")
    return cleaned


def normalize_jobs(jobs: list[JobCreate]) -> list[JobCreate]:
    """Normalize a batch of jobs."""
    for job in jobs:
        # Skills
        if job.skills is not None:
            job.skills = _normalize_skills(job.skills)

        # Location
        if job.location:
            job.location = _normalize_location(job.location)

        # Salary types already validated as int | None — no-op here
        # salary_text left unchanged (free text)

    return jobs
