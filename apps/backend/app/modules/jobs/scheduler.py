"""Lightweight job sync scheduler — background thread, no Celery.

Uses a simple ``threading.Thread`` with a configurable sleep interval.
Safe to start and stop.  Disabled by default.
"""

from __future__ import annotations

import logging
import threading
import time
from typing import Callable

from app.core.config import settings

logger = logging.getLogger(__name__)

# ── Module-level state ────────────────────────────────────────────────
_scheduler_thread: threading.Thread | None = None
_stop_event: threading.Event | None = None


# ── Public API ────────────────────────────────────────────────────────


def is_running() -> bool:
    """Return True when the scheduler background thread is active."""
    return _scheduler_thread is not None and _scheduler_thread.is_alive()


def start_scheduler(run_fn: Callable[[], None]) -> None:
    """Start the background scheduler thread.

    *run_fn* is called once per interval.  Exceptions inside *run_fn*
    are logged and do not stop the scheduler.

    Safe to call multiple times — subsequent calls are no-ops.
    """
    global _scheduler_thread, _stop_event  # noqa: PLW0603

    if is_running():
        logger.info("Scheduler already running — skipping start.")
        return

    if not settings.JOBS_SCHEDULER_ENABLED:
        logger.info("Scheduler disabled (JOBS_SCHEDULER_ENABLED=False).")
        return

    _stop_event = threading.Event()
    interval = max(60, settings.JOBS_SYNC_INTERVAL_HOURS * 3600)

    _scheduler_thread = threading.Thread(
        target=_scheduler_loop,
        args=(run_fn, _stop_event, interval),
        name="jobs-scheduler",
        daemon=True,
    )
    _scheduler_thread.start()
    logger.info(
        "Scheduler started — interval=%ss", interval
    )


def stop_scheduler(timeout: float = 15.0) -> None:
    """Signal the scheduler to stop and wait for the thread to finish.

    Safe to call multiple times — subsequent calls are no-ops.
    """
    global _scheduler_thread, _stop_event  # noqa: PLW0603

    if _stop_event is not None:
        _stop_event.set()

    if _scheduler_thread is not None and _scheduler_thread.is_alive():
        _scheduler_thread.join(timeout=timeout)
        logger.info("Scheduler stopped.")

    _scheduler_thread = None
    _stop_event = None


# ── Internal ──────────────────────────────────────────────────────────


def _scheduler_loop(
    run_fn: Callable[[], None],
    stop: threading.Event,
    interval: int,
) -> None:
    """Run *run_fn* once immediately, then every *interval* seconds."""
    while not stop.is_set():
        try:
            run_fn()
        except Exception:
            logger.exception("Scheduler task failed — will retry after interval.")
        stop.wait(interval)
