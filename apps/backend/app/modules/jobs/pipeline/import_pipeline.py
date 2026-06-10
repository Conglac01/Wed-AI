"""Job import pipeline — orchestrate all stages and persist to the database."""

from sqlalchemy.orm import Session

from app.modules.jobs.pipeline import ImportSummary
from app.modules.jobs.pipeline.cleaning import clean_jobs
from app.modules.jobs.pipeline.deduplication import (
    deduplicate_in_batch,
    filter_db_duplicates,
)
from app.modules.jobs.pipeline.normalization import normalize_jobs
from app.modules.jobs.pipeline.quality_score import calculate_quality_score
from app.modules.jobs.pipeline.skill_extractor import extract_and_normalize_skills
from app.modules.jobs.pipeline.validation import validate_jobs
from app.modules.jobs.repository import JobRepository
from app.modules.jobs.sources.base import BaseJobSource


class JobImportPipeline:
    """Orchestrates the full import pipeline: source → db.

    Usage:
        pipeline = JobImportPipeline(db_session)
        summary = pipeline.run(source, dry_run=False)
    """

    def __init__(self, db: Session) -> None:
        self._db = db
        self._repo = JobRepository(db)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def run(self, source: BaseJobSource, *, dry_run: bool = False) -> ImportSummary:
        """Execute the full pipeline and return an ImportSummary."""
        summary = ImportSummary(source_name=source.source_name, dry_run=dry_run)

        # ── 1. Fetch ─────────────────────────────────────────
        try:
            jobs = source.fetch_jobs()
        except Exception as exc:
            summary.errors.append(f"Source fetch error: {exc}")
            return summary

        summary.fetched_count = len(jobs)

        # ── 2. Validate ──────────────────────────────────────
        val_result = validate_jobs(jobs)
        summary.validated_count = len(val_result.valid)
        if val_result.errors:
            summary.errors.extend(val_result.errors)
        if not val_result.valid:
            return summary
        jobs = val_result.valid

        # ── 3. Clean ─────────────────────────────────────────
        jobs = clean_jobs(jobs)
        summary.cleaned_count = len(jobs)

        # ── 4. In-batch dedup ────────────────────────────────
        dedup = deduplicate_in_batch(jobs)
        summary.skipped_duplicate_count += dedup.duplicate_count
        jobs = dedup.unique

        # ── 5. DB-aware dedup ────────────────────────────────
        new_jobs, db_dupes = filter_db_duplicates(jobs, self._repo)
        summary.skipped_duplicate_count += db_dupes
        jobs = new_jobs

        # ── 6. Normalize ─────────────────────────────────────
        jobs = normalize_jobs(jobs)
        summary.normalized_count = len(jobs)

        # ── 7. Extract skills ────────────────────────────────
        jobs = extract_and_normalize_skills(jobs)

        # ── 8. Quality score ────────────────────────────────
        scored: list[tuple[object, float]] = [
            (job, calculate_quality_score(job)) for job in jobs
        ]

        # ── 9. Persist ──────────────────────────────────────
        if dry_run:
            return summary

        # TODO (Phase 4+): Consider batch insert support for large imports
        # (1000+ jobs) to reduce transaction overhead.

        for job, score in scored:
            try:
                self._repo.create(job, quality_score=score)
                summary.inserted_count += 1
            except Exception as exc:
                summary.failed_count += 1
                summary.errors.append(
                    f"Insert error [{job.title}]: {exc}"
                )

        return summary
