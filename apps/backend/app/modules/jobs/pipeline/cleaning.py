"""Cleaning stage — trim whitespace, collapse spaces, blank→None."""

import re

from app.modules.jobs.schema import JobCreate

_COLLAPSE_SPACES = re.compile(r" {2,}")


def _clean_str(value: str | None) -> str | None:
    """Trim, collapse repeated spaces, blank → None. Preserves Vietnamese accents."""
    if value is None:
        return None
    cleaned = value.strip()
    cleaned = _COLLAPSE_SPACES.sub(" ", cleaned)
    return cleaned if cleaned else None


def clean_jobs(jobs: list[JobCreate]) -> list[JobCreate]:
    """Clean a batch of jobs in-place and return the list."""
    for job in jobs:
        job.title = _clean_str(job.title) or ""
        job.company_name = _clean_str(job.company_name) or ""
        job.location = _clean_str(job.location) or ""
        job.description = _clean_str(job.description) or ""
        job.company_logo_url = _clean_str(job.company_logo_url)
        job.salary_text = _clean_str(job.salary_text)
        job.requirements = _clean_str(job.requirements)
        job.benefits = _clean_str(job.benefits)
        job.deadline = _clean_str(job.deadline)
        job.source_name = _clean_str(job.source_name)
        job.source_url = _clean_str(job.source_url)
    return jobs
