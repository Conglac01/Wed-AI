"""Validation stage — reject malformed JobCreate payloads."""

from dataclasses import dataclass, field

from app.modules.jobs.schema import JobCreate


@dataclass
class ValidationResult:
    valid: list[JobCreate] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)


# ------------------------------------------------------------------
# Per-job validation
# ------------------------------------------------------------------


def _validate_one(payload: JobCreate) -> list[str]:
    """Return a list of validation error messages (empty = valid)."""
    errs: list[str] = []

    if not payload.title or not payload.title.strip():
        errs.append("title is required")
    if not payload.company_name or not payload.company_name.strip():
        errs.append("company_name is required")
    if not payload.location or not payload.location.strip():
        errs.append("location is required")
    if not payload.description or not payload.description.strip():
        errs.append("description is required")

    # Salary sanity check
    if (
        payload.salary_min is not None
        and payload.salary_max is not None
        and payload.salary_min > payload.salary_max
    ):
        errs.append(
            f"salary_min ({payload.salary_min}) > salary_max ({payload.salary_max})"
        )

    return errs


# ------------------------------------------------------------------
# Bulk entry-point
# ------------------------------------------------------------------


def validate_jobs(jobs: list[JobCreate]) -> ValidationResult:
    """Validate a batch of JobCreate payloads. Invalid items are collected as errors."""
    result = ValidationResult()
    for idx, job in enumerate(jobs):
        errs = _validate_one(job)
        if errs:
            result.errors.append(
                f"[{idx}] {job.title or '<untitled>'} — " + "; ".join(errs)
            )
        else:
            result.valid.append(job)
    return result
