"""Unit tests for Crawl4AIClient and RawPage — network-independent."""

from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.infrastructure.external.crawl4ai_client import Crawl4AIClient, RawPage

# ── Fixture paths (shared with jobs module) ────────────────────────────────

_FIXTURES = (
    Path(__file__).resolve().parents[3]  # apps/backend/
    / "app"
    / "modules"
    / "jobs"
    / "tests"
    / "fixtures"
)


def _read_fixture(name: str) -> str:
    path = _FIXTURES / name
    if not path.exists():
        pytest.skip(f"Fixture not found: {path}")
    return path.read_text(encoding="utf-8")


# ═════════════════════════════════════════════════════════════════════════
# RawPage — Pydantic contract
# ═════════════════════════════════════════════════════════════════════════


class TestRawPage:
    """RawPage must be a valid Pydantic model with correct defaults."""

    def test_raw_page_is_pydantic(self):
        page = RawPage(url="https://example.com")
        assert isinstance(page, RawPage)

    def test_defaults(self):
        page = RawPage(url="https://example.com")
        assert page.html is None
        assert page.markdown is None
        assert page.text is None
        assert page.success is False
        assert page.error is None

    def test_json_serializable(self):
        page = RawPage(
            url="https://example.com",
            html="<html><body>Hello</body></html>",
            markdown="# Hello",
            text="Hello",
            success=True,
            error=None,
        )
        dumped = page.model_dump()
        reloaded = json.loads(json.dumps(dumped))
        assert reloaded["url"] == "https://example.com"
        assert reloaded["html"] == "<html><body>Hello</body></html>"
        assert reloaded["markdown"] == "# Hello"
        assert reloaded["success"] is True
        assert reloaded["error"] is None

    def test_json_serializable_failure_case(self):
        page = RawPage(
            url="https://blocked.example.com",
            success=False,
            error="Connection timed out",
        )
        dumped = json.loads(json.dumps(page.model_dump()))
        assert dumped["success"] is False
        assert "timed out" in dumped["error"]

    def test_all_fields_independent_from_crawl4ai(self):
        """RawPage must not reference any Crawl4AI types."""
        import inspect

        src = inspect.getsource(RawPage)
        # Strip the class docstring — mentions of our own Crawl4AIClient
        # wrapper class name are fine; we check for Crawl4AI *types* only.
        assert "CrawlResult" not in src
        assert "from crawl4ai" not in src
        assert "import crawl4ai" not in src
        assert "CareerLink" not in src


# ═════════════════════════════════════════════════════════════════════════
# Crawl4AIClient — success mapping
# ═════════════════════════════════════════════════════════════════════════


class TestCrawl4AIClientSuccess:
    """Verify that a successful Crawl4AI response maps correctly to RawPage."""

    @pytest.fixture
    def mock_result(self):
        """Create a mock that mimics a successful Crawl4AI result object."""
        mock = MagicMock()
        mock.url = "https://careerlink.vn/test-job"
        mock.html = "<html><body>Job detail</body></html>"
        mock.markdown = "# Job Detail\n\nSome markdown content"
        mock.cleaned_html = "<body>Job detail</body>"
        mock.success = True
        mock.error_message = ""
        return mock

    @pytest.mark.asyncio
    async def test_fetch_page_maps_html(self, mock_result):
        with (
            patch("crawl4ai.AsyncWebCrawler") as mock_crawler_cls,
        ):
            mock_crawler = MagicMock()
            mock_crawler.arun = AsyncMock(return_value=mock_result)
            mock_crawler_cls.return_value.__aenter__ = AsyncMock(
                return_value=mock_crawler
            )
            mock_crawler_cls.return_value.__aexit__ = AsyncMock(
                return_value=None
            )

            client = Crawl4AIClient()
            page = await client.fetch_page("https://careerlink.vn/test-job")

            assert isinstance(page, RawPage)
            assert page.url == "https://careerlink.vn/test-job"
            assert page.html == "<html><body>Job detail</body></html>"
            assert page.success is True

    @pytest.mark.asyncio
    async def test_fetch_page_maps_markdown(self, mock_result):
        with (
            patch("crawl4ai.AsyncWebCrawler") as mock_crawler_cls,
        ):
            mock_crawler = MagicMock()
            mock_crawler.arun = AsyncMock(return_value=mock_result)
            mock_crawler_cls.return_value.__aenter__ = AsyncMock(
                return_value=mock_crawler
            )
            mock_crawler_cls.return_value.__aexit__ = AsyncMock(
                return_value=None
            )

            client = Crawl4AIClient()
            page = await client.fetch_page("https://careerlink.vn/test-job")

            assert page.markdown == "# Job Detail\n\nSome markdown content"

    @pytest.mark.asyncio
    async def test_fetch_page_maps_cleaned_html_to_text(self, mock_result):
        with (
            patch("crawl4ai.AsyncWebCrawler") as mock_crawler_cls,
        ):
            mock_crawler = MagicMock()
            mock_crawler.arun = AsyncMock(return_value=mock_result)
            mock_crawler_cls.return_value.__aenter__ = AsyncMock(
                return_value=mock_crawler
            )
            mock_crawler_cls.return_value.__aexit__ = AsyncMock(
                return_value=None
            )

            client = Crawl4AIClient()
            page = await client.fetch_page("https://careerlink.vn/test-job")

            assert page.text == "<body>Job detail</body>"

    @pytest.mark.asyncio
    async def test_fetch_page_maps_error_none_on_success(self, mock_result):
        with (
            patch("crawl4ai.AsyncWebCrawler") as mock_crawler_cls,
        ):
            mock_crawler = MagicMock()
            mock_crawler.arun = AsyncMock(return_value=mock_result)
            mock_crawler_cls.return_value.__aenter__ = AsyncMock(
                return_value=mock_crawler
            )
            mock_crawler_cls.return_value.__aexit__ = AsyncMock(
                return_value=None
            )

            client = Crawl4AIClient()
            page = await client.fetch_page("https://careerlink.vn/test-job")

            assert page.error is None


# ═════════════════════════════════════════════════════════════════════════
# Crawl4AIClient — failure mapping
# ═════════════════════════════════════════════════════════════════════════


class TestCrawl4AIClientFailure:
    """Verify that Crawl4AI failures map correctly to RawPage."""

    @pytest.mark.asyncio
    async def test_fetch_page_error_message_mapped(self):
        """When Crawl4AI reports an error, it becomes RawPage.error."""
        mock_result = MagicMock()
        mock_result.url = "https://blocked.example.com"
        mock_result.html = ""
        mock_result.markdown = ""
        mock_result.cleaned_html = None
        mock_result.success = False
        mock_result.error_message = "403 Forbidden"

        with (
            patch("crawl4ai.AsyncWebCrawler") as mock_crawler_cls,
        ):
            mock_crawler = MagicMock()
            mock_crawler.arun = AsyncMock(return_value=mock_result)
            mock_crawler_cls.return_value.__aenter__ = AsyncMock(
                return_value=mock_crawler
            )
            mock_crawler_cls.return_value.__aexit__ = AsyncMock(
                return_value=None
            )

            client = Crawl4AIClient()
            page = await client.fetch_page("https://blocked.example.com")

            assert page.success is False
            assert page.error == "403 Forbidden"
            assert page.html is None

    @pytest.mark.asyncio
    async def test_fetch_page_crawl4ai_exception_caught(self):
        """When Crawl4AI itself raises, capture as RawPage.error."""
        with (
            patch("crawl4ai.AsyncWebCrawler") as mock_crawler_cls,
        ):
            mock_crawler_cls.return_value.__aenter__ = AsyncMock(
                side_effect=RuntimeError("DNS resolution failed")
            )

            client = Crawl4AIClient()
            page = await client.fetch_page("https://invalid.example.com")

            assert page.success is False
            assert "DNS resolution failed" in (page.error or "")
            assert page.html is None
            assert page.markdown is None


# ═════════════════════════════════════════════════════════════════════════
# Crawl4AIClient — sync API
# ═════════════════════════════════════════════════════════════════════════


class TestFetchPageSync:
    """Verify that fetch_page_sync returns RawPage correctly."""

    def test_fetch_page_sync_returns_raw_page(self):
        """fetch_page_sync must return a RawPage (mocked)."""
        mock_result = MagicMock()
        mock_result.url = "https://example.com"
        mock_result.html = "<html><body>Test</body></html>"
        mock_result.markdown = "# Test"
        mock_result.cleaned_html = "<body>Test</body>"
        mock_result.success = True
        mock_result.error_message = ""

        with (
            patch("crawl4ai.AsyncWebCrawler") as mock_crawler_cls,
        ):
            mock_crawler = MagicMock()
            mock_crawler.arun = AsyncMock(return_value=mock_result)
            mock_crawler_cls.return_value.__aenter__ = AsyncMock(
                return_value=mock_crawler
            )
            mock_crawler_cls.return_value.__aexit__ = AsyncMock(
                return_value=None
            )

            client = Crawl4AIClient()
            page = client.fetch_page_sync("https://example.com")

            assert isinstance(page, RawPage)
            assert page.success is True
            assert page.html == "<html><body>Test</body></html>"
            assert page.markdown == "# Test"
            assert page.text == "<body>Test</body>"

    def test_fetch_page_sync_failure_returns_raw_page(self):
        """Even on failure, fetch_page_sync must return RawPage, not raise."""
        with (
            patch("crawl4ai.AsyncWebCrawler") as mock_crawler_cls,
        ):
            mock_crawler_cls.return_value.__aenter__ = AsyncMock(
                side_effect=TimeoutError("Connection timed out")
            )

            client = Crawl4AIClient()
            page = client.fetch_page_sync("https://slow.example.com")

            assert isinstance(page, RawPage)
            assert page.success is False
            assert page.error is not None


# ═════════════════════════════════════════════════════════════════════════
# Database isolation — Crawl4AIClient must NOT touch DB
# ═════════════════════════════════════════════════════════════════════════


class TestCrawl4AIClientIsolation:
    """Verify Crawl4AIClient has zero database or module dependencies."""

    def test_no_repository_imports(self):
        import inspect

        from app.infrastructure.external import crawl4ai_client as m

        src = inspect.getsource(m)
        assert "repository" not in src.lower()
        assert "service" not in src.lower()
        assert "from app.db" not in src
        assert "from app.modules" not in src
        assert "session.add" not in src.lower()
        assert "session.commit" not in src.lower()

    def test_raw_page_no_db_imports(self):
        import inspect

        src = inspect.getsource(RawPage)
        assert "repository" not in src.lower()
        assert "service" not in src.lower()
        assert "from app.db" not in src
        assert "from app.modules" not in src

    def test_no_careerlink_hardcode(self):
        """Client must be source-agnostic — no CareerLink imports/logic."""
        import inspect

        from app.infrastructure.external import crawl4ai_client as m

        src = inspect.getsource(m)
        # Check imports only — docstring mentions are fine
        imports = [
            line for line in src.split("\n")
            if line.strip().startswith(("import ", "from "))
        ]
        import_text = "\n".join(imports)
        assert "careerlink" not in import_text.lower()
        assert "parse_job" not in import_text.lower()
        assert "JobCreate" not in import_text


# ═════════════════════════════════════════════════════════════════════════
# End-to-end compatibility — Crawl4AIClient → RawPage → parse_job_detail
# ═════════════════════════════════════════════════════════════════════════


class TestParserCompatibility:
    """Prove RawPage.html can be fed directly into parse_job_detail()."""

    def test_raw_page_feeds_parser(self):
        """RawPage(html=fixture) → parse_job_detail() → JobCreate."""
        html = _read_fixture("sample_detail.html")
        source_url = (
            "https://careerlink.vn/tim-viec-lam/senior-ai-engineer/3533220"
        )

        page = RawPage(
            url=source_url,
            html=html,
            markdown=None,
            text=None,
            success=True,
            error=None,
        )

        # This is the key compatibility assertion from Phase 2.6 spec
        from app.modules.jobs.parsers.detail_parser import parse_job_detail
        from app.modules.jobs.schema import JobCreate

        job = parse_job_detail(html=page.html, source_url=page.url)

        assert isinstance(job, JobCreate)
        assert job.title == "Senior AI Engineer"
        assert job.company_name == "DIGI-TEXX VIETNAM"
        assert "Hồ Chí Minh" in job.location

    def test_raw_page_url_preserved(self):
        """The source_url must survive the RawPage → parser round-trip."""
        html = _read_fixture("sample_detail.html")
        source_url = "https://careerlink.vn/test-url-preserved"

        page = RawPage(url=source_url, html=html, success=True)

        from app.modules.jobs.parsers.detail_parser import parse_job_detail

        job = parse_job_detail(html=page.html, source_url=page.url)
        assert job.source_url == source_url

    def test_failure_page_not_parsed(self):
        """RawPage with success=False should NOT be passed to parser."""
        page = RawPage(
            url="https://careerlink.vn/broken",
            success=False,
            error="Request failed",
        )
        assert page.success is False
        assert page.html is None
        # Caller should check success before passing to parser.
        # This test verifies the guard condition is detectable.
        if page.success and page.html:
            from app.modules.jobs.parsers.detail_parser import (
                parse_job_detail,
            )
            parse_job_detail(page.html, page.url)
        # No exception = correct (caller skipped failed page).
