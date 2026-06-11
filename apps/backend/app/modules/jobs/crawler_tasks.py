"""CareerLink crawler task — source → pipeline → summary.

This module bridges the existing CareerLinkSource with the existing
JobImportPipeline.  It NEVER writes to the database directly — all writes
go through the pipeline.
"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field

from sqlalchemy.orm import Session

from app.modules.jobs.pipeline.import_pipeline import JobImportPipeline
from app.modules.jobs.source_guard import is_blocked_response
from app.modules.jobs.sources.careerlink_source import CareerLinkSource

logger = logging.getLogger(__name__)

# ── Default listing URL ───────────────────────────────────────────────
_DEFAULT_LISTING_URL = "https://careerlink.vn/viec-lam/cntt-phan-mem/19"

# ── Maximum consecutive listing-page fetch failures before circuit-break ──
_MAX_CONSECUTIVE_FAILURES = 3


@dataclass
class CrawlSummary:
    """Result of a single crawl run."""

    source: str = "CareerLink"
    status: str = "ok"  # "ok" | "blocked" | "error"
    reason: str | None = None
    fetched: int = 0
    imported: int = 0
    skipped: int = 0
    failed: int = 0
    errors: list[str] = field(default_factory=list)


def run_careerlink_crawl(
    db: Session,
    *,
    listing_url: str | None = None,
    max_jobs: int = 50,
    timeout_seconds: int = 30,
    request_delay_seconds: float = 1.0,
) -> CrawlSummary:
    """Fetch CareerLink jobs and import them through the pipeline.

    Args:
        db: An active SQLAlchemy session.
        listing_url: Override the default CareerLink IT listing URL.
        max_jobs: Maximum detail pages to fetch and parse.
        timeout_seconds: Per-request timeout (passed to CareerLinkSource).
        request_delay_seconds: Delay between detail-page fetches.

    Returns a ``CrawlSummary`` with counts and any errors encountered.
    """
    resolved_url = listing_url or _DEFAULT_LISTING_URL

    # ── 0. Pre-flight check: is the listing page blocked? ──────────
    block_reason = _check_listing_blocked(resolved_url)
    if block_reason:
        logger.warning(
            "CAPTCHA_DETECTED — CareerLink sync aborted: %s", block_reason
        )
        return CrawlSummary(
            source="CareerLink",
            status="blocked",
            reason="captcha_detected",
            fetched=0,
            imported=0,
            skipped=0,
            failed=0,
            errors=[f"CareerLink blocked by captcha: {block_reason}"],
        )

    summary = CrawlSummary(source="CareerLink")

    # ── 1. Instantiate the existing source ─────────────────────────
    try:
        source = CareerLinkSource(
            listing_url=resolved_url,
            max_jobs=max_jobs,
        )
    except Exception as exc:
        summary.status = "error"
        summary.reason = "source_init_failed"
        summary.errors.append(f"Source init error: {exc}")
        return summary

    # ── 2. Fetch jobs via the existing source contract ─────────────
    try:
        jobs = source.fetch_jobs()
    except Exception as exc:
        summary.status = "error"
        summary.reason = "source_fetch_failed"
        summary.errors.append(f"Source fetch error: {exc}")
        return summary

    summary.fetched = len(jobs)

    # ── 2b. Stamp source_name on every job ─────────────────────────
    for job in jobs:
        if not job.source_name:
            job.source_name = "CareerLink"

    if not jobs:
        return summary

    # ── 3. Enforce inter-request delay ─────────────────────────────
    # CareerLinkSource fetches in a tight loop; we add a configurable
    # pause between requests to be polite to the upstream server.
    if request_delay_seconds > 0:
        time.sleep(request_delay_seconds)

    # ── 4. Run the existing import pipeline ────────────────────────
    pipeline = JobImportPipeline(db)
    try:
        result = pipeline.run(
            CareerLinkPassthrough(jobs, source.source_name), dry_run=False
        )
    except Exception as exc:
        summary.status = "error"
        summary.reason = "pipeline_failed"
        summary.errors.append(f"Pipeline error: {exc}")
        return summary

    summary.imported = result.inserted_count
    summary.skipped = result.skipped_duplicate_count
    summary.failed = result.failed_count
    summary.errors.extend(result.errors)

    return summary


# ────────────────────────────────────────────────────────────────────
# Internal helpers
# ────────────────────────────────────────────────────────────────────


def _check_listing_blocked(listing_url: str) -> str | None:
    """Fetch *listing_url* via Crawl4AI and check for anti-bot blocks.

    Returns a human-readable reason string if the page is blocked,
    or ``None`` if the page appears normal.
    """
    try:
        from app.infrastructure.external.crawl4ai_client import Crawl4AIClient

        client = Crawl4AIClient()
        page = client.fetch_page_sync(listing_url)

        if not page.success:
            logger.warning("Listing page fetch failed: %s", page.error)
            # The page fetch itself failed — not necessarily a captcha.
            # This could be a timeout, DNS error, etc.  Don't report as
            # blocked; let the caller decide.
            return None

        if page.html and is_blocked_response(page.html):
            return "listing page contains captcha/anti-bot indicators"

        return None
    except Exception:
        logger.exception("Pre-flight listing check failed for %s", listing_url)
        return None



# ────────────────────────────────────────────────────────────────────
# Internal passthrough — wraps a pre-fetched job list as a BaseJobSource
# so we never call CareerLinkSource.fetch_jobs() inside the pipeline
# (the pipeline also calls fetch_jobs, but we already have the jobs).
# ────────────────────────────────────────────────────────────────────


class CareerLinkPassthrough:
    """Adapter that lets the import pipeline consume pre-fetched JobCreate
    objects without calling CareerLinkSource.fetch_jobs() a second time."""

    def __init__(self, jobs, name: str) -> None:
        self._jobs = jobs
        self._name = name

    @property
    def source_name(self) -> str:
        return self._name

    def fetch_jobs(self):
        return list(self._jobs)
