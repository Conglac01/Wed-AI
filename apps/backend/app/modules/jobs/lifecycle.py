"""Jobs module lifecycle — safe startup / shutdown hooks.

Call ``start_jobs_lifecycle()`` once during application bootstrap and
``stop_jobs_lifecycle()`` during graceful shutdown.
"""

from __future__ import annotations

import logging

from app.core.config import settings
from app.db.session import SessionLocal
from app.modules.jobs.crawler_tasks import run_careerlink_crawl
from app.modules.jobs.scheduler import start_scheduler, stop_scheduler

logger = logging.getLogger(__name__)

_started = False


def _crawl_job() -> None:
    """Single crawl run — the scheduler calls this periodically."""
    db = SessionLocal()
    try:
        summary = run_careerlink_crawl(
            db,
            max_jobs=settings.JOBS_SYNC_MAX_JOBS,
            timeout_seconds=settings.JOBS_SYNC_TIMEOUT_SECONDS,
            request_delay_seconds=settings.CRAWLER_REQUEST_DELAY_SECONDS,
        )
        logger.info(
            "CareerLink crawl: fetched=%d imported=%d skipped=%d failed=%d",
            summary.fetched,
            summary.imported,
            summary.skipped,
            summary.failed,
        )
        if summary.errors:
            for err in summary.errors[:3]:
                logger.warning("Crawl error: %s", err)
    finally:
        db.close()


def start_jobs_lifecycle() -> None:
    """Start the jobs scheduler (idempotent)."""
    global _started  # noqa: PLW0603
    if _started:
        return
    _started = True
    start_scheduler(_crawl_job)


def stop_jobs_lifecycle() -> None:
    """Stop the jobs scheduler (idempotent)."""
    global _started  # noqa: PLW0603
    _started = False
    stop_scheduler()
