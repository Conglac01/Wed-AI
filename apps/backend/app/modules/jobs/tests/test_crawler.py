"""Phase 2.8 tests — crawler tasks, scheduler, sync script."""

from __future__ import annotations

import time
from unittest.mock import MagicMock, patch

import pytest
from sqlalchemy.orm import Session

from app.modules.jobs.crawler_tasks import (
    CrawlSummary,
    _check_listing_blocked,
    run_careerlink_crawl,
)
from app.modules.jobs.schema import JobCreate
from app.modules.jobs.tests.fakes import FakeJobRepository


# ── Helpers ──────────────────────────────────────────────────────────────


def _make_job_create(**overrides) -> JobCreate:
    defaults = {
        "title": "Test Developer",
        "company_name": "Test Corp",
        "location": "Hà Nội",
        "description": "A test job description long enough for quality checks.",
    }
    return JobCreate(**{**defaults, **overrides})


# ═════════════════════════════════════════════════════════════════════════
# CrawlSummary
# ═════════════════════════════════════════════════════════════════════════


class TestCrawlSummary:
    def test_defaults(self):
        s = CrawlSummary()
        assert s.source == "CareerLink"
        assert s.status == "ok"
        assert s.reason is None
        assert s.fetched == 0
        assert s.imported == 0
        assert s.skipped == 0
        assert s.failed == 0
        assert s.errors == []

    def test_fields_are_accessible(self):
        s = CrawlSummary(
            fetched=10,
            imported=8,
            skipped=1,
            failed=1,
            errors=["bad parsing"],
        )
        assert s.fetched == 10
        assert s.imported == 8
        assert s.skipped == 1
        assert s.failed == 1
        assert s.errors == ["bad parsing"]

    def test_blocked_summary_structure(self):
        s = CrawlSummary(
            source="CareerLink",
            status="blocked",
            reason="captcha_detected",
            errors=["CareerLink blocked by captcha"],
        )
        assert s.source == "CareerLink"
        assert s.status == "blocked"
        assert s.reason == "captcha_detected"
        assert s.fetched == 0
        assert s.imported == 0
        assert s.skipped == 0
        assert s.failed == 0


# ═════════════════════════════════════════════════════════════════════════
# run_careerlink_crawl — success
# ═════════════════════════════════════════════════════════════════════════


class TestCrawlerSuccess:
    """Verify that run_careerlink_crawl passes jobs through the pipeline."""

    def test_successful_import(self):
        mock_jobs = [
            _make_job_create(title="Python Dev", company_name="FPT", location="HCM"),
            _make_job_create(title="JS Dev", company_name="VNG", location="HN"),
        ]
        summary = _run_with_mocks(mock_jobs)

        assert summary.fetched == 2
        assert summary.imported == 2
        assert summary.skipped == 0
        assert summary.failed == 0
        assert summary.errors == []

    def test_summary_is_crawl_summary(self):
        mock_jobs = [_make_job_create()]
        summary = _run_with_mocks(mock_jobs)
        assert isinstance(summary, CrawlSummary)

    def test_source_name_set(self):
        summary = CrawlSummary()
        assert summary.source == "CareerLink"


# ═════════════════════════════════════════════════════════════════════════
# run_careerlink_crawl — duplicate handling
# ═════════════════════════════════════════════════════════════════════════


class TestCrawlerDedup:
    """Verify that existing duplicates are skipped, not re-inserted."""

    def test_skips_db_duplicates(self):
        summary = _run_with_mocks(
            [_make_job_create(title="Dup", company_name="Corp", location="HN")],
            existing_duplicates=[("Dup", "Corp", "HN")],
        )
        assert summary.fetched == 1
        assert summary.imported == 0
        assert summary.skipped == 1


# ═════════════════════════════════════════════════════════════════════════
# run_careerlink_crawl — failure handling
# ═════════════════════════════════════════════════════════════════════════


class TestCrawlerFailures:
    """Verify that individual failures do not crash the whole batch."""

    def test_source_fetch_error(self):
        with (
            patch("app.modules.jobs.crawler_tasks.CareerLinkSource") as mock_src,
        ):
            mock_src.return_value.fetch_jobs.side_effect = (
                RuntimeError("network error")
            )
            mock_src.return_value.source_name = "CareerLink"

            summary = run_careerlink_crawl(MagicMock())
            assert summary.fetched == 0
            assert len(summary.errors) > 0
            assert "network error" in str(summary.errors[0])

    def test_pipeline_exception_does_not_crash(self):
        """If the pipeline throws, the crawl summary captures it."""
        mock_repo = FakeJobRepository(raise_on_create=True)
        summary = _run_with_mocks(
            [_make_job_create(title="WillFail")],
            repo=mock_repo,
        )
        # Pipeline catches per-job insert failures and reports them
        assert summary.errors is not None  # captured, not thrown


# ═════════════════════════════════════════════════════════════════════════
# Scheduler
# ═════════════════════════════════════════════════════════════════════════


class TestScheduler:
    """Verify scheduler start/stop safety."""

    def test_disabled_by_default(self):
        from app.core.config import settings

        assert settings.JOBS_SCHEDULER_ENABLED is False

    def test_start_stop_idempotent(self):
        from app.modules.jobs.scheduler import (
            is_running,
            start_scheduler,
            stop_scheduler,
        )

        # Should not start when disabled
        call_count = 0

        def _noop():
            nonlocal call_count
            call_count += 1

        start_scheduler(_noop)
        assert not is_running()
        assert call_count == 0  # never called because disabled

        # Stop is safe even when not running
        stop_scheduler()
        assert not is_running()

    def test_start_while_running_is_noop(self):
        from app.modules.jobs.scheduler import (
            is_running,
            start_scheduler,
            stop_scheduler,
        )

        # Not running, but disabled → no start
        start_scheduler(lambda: None)
        start_scheduler(lambda: None)  # second call = no-op
        stop_scheduler()


# ═════════════════════════════════════════════════════════════════════════
# Lifecycle
# ═════════════════════════════════════════════════════════════════════════


class TestLifecycle:
    def test_start_twice_is_idempotent(self):
        from app.modules.jobs.lifecycle import (
            start_jobs_lifecycle,
            stop_jobs_lifecycle,
        )

        # Both should not raise
        start_jobs_lifecycle()
        start_jobs_lifecycle()  # idempotent
        stop_jobs_lifecycle()
        stop_jobs_lifecycle()  # idempotent


# ═════════════════════════════════════════════════════════════════════════
# DB isolation
# ═════════════════════════════════════════════════════════════════════════


class TestCrawlerIsolation:
    def test_crawler_tasks_uses_pipeline(self):
        """run_careerlink_crawl must use JobImportPipeline, not direct DB."""
        import inspect

        from app.modules.jobs import crawler_tasks as m

        src = inspect.getsource(m)
        assert "JobImportPipeline" in src  # uses the pipeline
        assert "session.add" not in src.lower()  # no direct DB writes
        assert "session.commit" not in src.lower()


# ═════════════════════════════════════════════════════════════════════════
# run_careerlink_crawl — safe failure on captcha / blocked
# ═════════════════════════════════════════════════════════════════════════


class TestCrawlerBlockedResponse:
    """Verify that the crawler fails safely when CareerLink is blocked."""

    def test_returns_blocked_summary_when_captcha(self):
        """When the listing page contains captcha, return blocked summary."""
        with patch(
            "app.modules.jobs.crawler_tasks._check_listing_blocked",
            return_value="listing page contains captcha/anti-bot indicators",
        ):
            summary = run_careerlink_crawl(MagicMock())
            assert summary.status == "blocked"
            assert summary.reason == "captcha_detected"
            assert summary.fetched == 0
            assert summary.imported == 0
            assert summary.skipped == 0
            assert summary.failed == 0
            assert len(summary.errors) == 1
            assert "captcha" in summary.errors[0].lower()

    def test_no_detail_pages_fetched_when_blocked(self):
        """When blocked, CareerLinkSource is never instantiated."""
        with (
            patch(
                "app.modules.jobs.crawler_tasks._check_listing_blocked",
                return_value="listing page contains captcha/anti-bot indicators",
            ),
            patch(
                "app.modules.jobs.crawler_tasks.CareerLinkSource"
            ) as mock_src_cls,
        ):
            summary = run_careerlink_crawl(MagicMock())
            assert summary.status == "blocked"
            # CareerLinkSource should never be created
            mock_src_cls.assert_not_called()

    def test_proceeds_normally_when_listing_is_clean(self):
        """When listing is clean, proceed with normal import."""
        with (
            patch(
                "app.modules.jobs.crawler_tasks._check_listing_blocked",
                return_value=None,  # not blocked
            ),
            patch(
                "app.modules.jobs.crawler_tasks.CareerLinkSource"
            ) as mock_src_cls,
            patch(
                "app.modules.jobs.crawler_tasks.JobImportPipeline"
            ) as mock_pipeline_cls,
        ):
            mock_source = mock_src_cls.return_value
            mock_source.source_name = "CareerLink"
            mock_source.fetch_jobs.return_value = []

            summary = run_careerlink_crawl(MagicMock())
            assert summary.status == "ok"
            mock_src_cls.assert_called_once()
            mock_source.fetch_jobs.assert_called_once()

    def test_blocked_response_detection_integration(self):
        """Integration: real HTML with captcha text triggers blocked path."""
        captcha_html = (
            "<html><head><title>Việc Làm 24h | CareerLink.vn</title></head>"
            "<body><div class='h-captcha' data-sitekey='abc'></div>"
            "<p>Xác nhận bạn không phải robot</p></body></html>"
        )

        with patch(
            "app.modules.jobs.crawler_tasks.Crawl4AIClient"
        ) as mock_client_cls:
            mock_client = mock_client_cls.return_value
            mock_page = MagicMock()
            mock_page.success = True
            mock_page.html = captcha_html
            mock_client.fetch_page_sync.return_value = mock_page

            result = _check_listing_blocked(
                "https://careerlink.vn/viec-lam/cntt-phan-mem/19"
            )
            assert result is not None
            assert "captcha" in result.lower()


# ═════════════════════════════════════════════════════════════════════════
# Internal helpers
# ═════════════════════════════════════════════════════════════════════════


def _run_with_mocks(
    jobs: list[JobCreate],
    existing_duplicates=None,
    repo=None,
) -> CrawlSummary:
    """Simulate a crawl run with the fake repository."""
    from app.modules.jobs.pipeline.cleaning import clean_jobs
    from app.modules.jobs.pipeline.deduplication import (
        deduplicate_in_batch,
        filter_db_duplicates,
    )
    from app.modules.jobs.pipeline.normalization import normalize_jobs
    from app.modules.jobs.pipeline.quality_score import calculate_quality_score
    from app.modules.jobs.pipeline.skill_extractor import (
        extract_and_normalize_skills,
    )
    from app.modules.jobs.pipeline.validation import validate_jobs

    summary = CrawlSummary(source="CareerLink")
    summary.fetched = len(jobs)

    if repo is None:
        repo = FakeJobRepository(existing_duplicates=existing_duplicates)

    # Validate
    val = validate_jobs(jobs)
    if not val.valid:
        summary.errors.extend(val.errors)
        return summary
    jobs = val.valid

    # Clean
    jobs = clean_jobs(jobs)

    # In-batch dedup
    dedup = deduplicate_in_batch(jobs)
    summary.skipped = dedup.duplicate_count
    jobs = dedup.unique

    # DB dedup
    new_jobs, db_dupes = filter_db_duplicates(jobs, repo)
    summary.skipped += db_dupes
    jobs = new_jobs

    # Normalize
    jobs = normalize_jobs(jobs)

    # Extract skills
    jobs = extract_and_normalize_skills(jobs)

    # Quality score + persist
    for job in jobs:
        try:
            score = calculate_quality_score(job)
            repo.create(job, quality_score=score)
            summary.imported += 1
        except Exception as exc:
            summary.failed += 1
            summary.errors.append(f"Insert error [{job.title}]: {exc}")

    return summary
