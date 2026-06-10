"""Quality score — deterministic 0.0–1.0 rating for job listing completeness."""

from app.modules.jobs.schema import JobCreate


def _meaningful(value: str | None) -> bool:
    """Return True if the string value is non-empty and reasonably descriptive."""
    if value is None:
        return False
    return len(value.strip()) >= 20


def calculate_quality_score(job: JobCreate) -> float:
    """Calculate a deterministic quality score for a single job.

    Criteria (each worth ~0.125):
      - title present
      - company_name present
      - location present
      - description meaningful (≥20 chars)
      - skills present
      - salary present (salary_min OR salary_text)
      - requirements present AND meaningful
      - benefits present AND meaningful
      - source_url present (bonus)

    Clamped to [0.0, 1.0].
    """
    score = 0.0

    if job.title and job.title.strip():
        score += 1.0
    if job.company_name and job.company_name.strip():
        score += 1.0
    if job.location and job.location.strip():
        score += 1.0
    if _meaningful(job.description):
        score += 1.0
    if job.skills:
        score += 1.0
    if job.salary_min is not None or (job.salary_text and job.salary_text.strip()):
        score += 1.0
    if _meaningful(job.requirements):
        score += 1.0
    if _meaningful(job.benefits):
        score += 1.0
    if job.source_url and job.source_url.strip():
        score += 0.5  # bonus

    # Normalize: max possible = 8.5 → divide by 8.5
    normalized = score / 8.5
    return max(0.0, min(1.0, round(normalized, 4)))
