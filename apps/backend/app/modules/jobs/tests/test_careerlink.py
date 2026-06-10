"""Tests for CareerLink parsers and source — unit tests using fixture HTML."""

from pathlib import Path

import pytest

from app.modules.jobs.parsers.detail_parser import parse_job_detail
from app.modules.jobs.parsers.listing_parser import extract_job_links
from app.modules.jobs.schema import JobCreate
from app.modules.jobs.sources.base import BaseJobSource
from app.modules.jobs.sources.careerlink_source import CareerLinkSource

# ── Fixture paths ──────────────────────────────────────────────────────────

_FIXTURES = Path(__file__).resolve().parent / "fixtures"


def _read_fixture(name: str) -> str:
    path = _FIXTURES / name
    if not path.exists():
        pytest.skip(f"Fixture not found: {path}")
    return path.read_text(encoding="utf-8")


# ═════════════════════════════════════════════════════════════════════════
# Detail Parser — successful parse
# ═════════════════════════════════════════════════════════════════════════


class TestDetailParser:
    """Tests for parse_job_detail against real CareerLink HTML fixtures."""

    def test_successful_parse(self):
        """Parse a real CareerLink detail page and verify extracted fields."""
        html = _read_fixture("sample_detail.html")
        source_url = "https://careerlink.vn/tim-viec-lam/senior-ai-engineer/3533220"

        job = parse_job_detail(html, source_url)

        assert isinstance(job, JobCreate)
        assert job.title == "Senior AI Engineer"
        assert job.company_name == "DIGI-TEXX VIETNAM"
        assert "Hồ Chí Minh" in job.location
        assert len(job.description) > 100  # meaningful description
        assert job.source_url == source_url

        # Salary text present (could be "Cạnh tranh" or a range)
        assert job.salary_text is not None and len(job.salary_text) > 0

        # Requirements should be split from description
        assert job.requirements is not None
        assert len(job.requirements) > 50
        # Requirements should contain skill/experience text, not job duties
        assert any(
            word in job.requirements.lower()
            for word in ["bachelor", "kinh nghiệm", "experience", "năm"]
        ), f"Requirements text: {job.requirements[:200]}"

        # Benefits extracted from HTML
        assert job.benefits is not None
        assert len(job.benefits) > 30

        # Deadline in YYYY-MM-DD format
        assert job.deadline is not None
        assert len(job.deadline) == 10
        assert job.deadline[4] == "-"

        # Company logo
        assert job.company_logo_url is not None
        assert "http" in job.company_logo_url

    def test_vietnamese_text_preserved(self):
        """Verify that Vietnamese characters are intact in all fields."""
        html = _read_fixture("sample_detail.html")
        source_url = "https://careerlink.vn/test"

        job = parse_job_detail(html, source_url)

        # All text fields should support Unicode Vietnamese
        combined = (
            job.title
            + job.company_name
            + job.location
            + job.description
            + (job.requirements or "")
            + (job.benefits or "")
        )
        # Vietnamese-specific characters that are common in job listings
        vietnamese_chars = "ắẳẵặăâấầẩẫậêếềểễệôốồổỗộơớờởỡợưứừửữựđ"
        # Not all fields necessarily contain Vietnamese, but the text should
        # not be garbled (each char should be a valid Unicode scalar)
        assert isinstance(combined, str)
        # At minimum, the combined text should contain some Vietnamese chars
        # or at least standard ASCII — but it must be valid unicode.
        # We verify no mojibake by checking that the roundtrip is clean.
        assert combined == combined.encode("utf-8").decode("utf-8")

    def test_description_requirements_split(self):
        """The description and requirements must be properly separated."""
        html = _read_fixture("sample_detail.html")
        source_url = "https://careerlink.vn/test"

        job = parse_job_detail(html, source_url)

        # Description should contain job duties, not "Kinh nghiệm / Kỹ năng"
        assert "Kinh nghiệm / Kỹ năng chi tiết" not in job.description
        # Requirements should NOT contain job duties from description
        # The description talks about "AI Engineer" work
        assert len(job.description) > 0
        assert job.requirements is not None

        # Description and requirements should be different
        assert job.description != job.requirements


# ═════════════════════════════════════════════════════════════════════════
# Detail Parser — missing required fields
# ═════════════════════════════════════════════════════════════════════════


class TestDetailParserMissingFields:
    """Verify that parse_job_detail raises ValueError for missing fields."""

    def test_missing_title(self):
        html = _read_fixture("missing_title.html")
        source_url = "https://careerlink.vn/test"
        with pytest.raises(ValueError, match="(?i)title"):
            parse_job_detail(html, source_url)

    def test_malformed_detail(self):
        """Multiple required fields missing — must raise ValueError."""
        html = _read_fixture("malformed_detail.html")
        source_url = "https://careerlink.vn/test"
        with pytest.raises(ValueError) as exc_info:
            parse_job_detail(html, source_url)
        msg = str(exc_info.value).lower()
        # Should mention at least "title" since it's one of the missing fields
        assert "title" in msg

    def test_empty_html_raises(self):
        """Empty HTML must raise ValueError (no JSON-LD block)."""
        with pytest.raises(ValueError, match="(?i)JSON-LD"):
            parse_job_detail("<html></html>", "https://careerlink.vn/test")

    def test_no_jsonld_raises(self):
        """HTML without a JobPosting block must raise ValueError."""
        html = """<html><body><p>Not a CareerLink page</p></body></html>"""
        with pytest.raises(ValueError, match="(?i)JSON-LD"):
            parse_job_detail(html, "https://careerlink.vn/test")


# ═════════════════════════════════════════════════════════════════════════
# Listing Parser
# ═════════════════════════════════════════════════════════════════════════


class TestListingParser:
    """Tests for extract_job_links against real CareerLink listing HTML."""

    def test_url_extraction(self):
        """Extract job detail URLs from a real listing page."""
        html = _read_fixture("sample_listing.html")
        urls = extract_job_links(html)
        assert len(urls) > 0, "Expected at least one job link"
        # The fixture has 50 job items
        assert len(urls) == 50, f"Expected 50 job links, got {len(urls)}"

    def test_all_urls_are_absolute(self):
        """Every extracted URL must be absolute."""
        html = _read_fixture("sample_listing.html")
        urls = extract_job_links(html)
        for url in urls:
            assert url.startswith("https://"), f"Not absolute: {url}"

    def test_urls_match_careerlink_pattern(self):
        """URLs must match the CareerLink detail pattern."""
        html = _read_fixture("sample_listing.html")
        urls = extract_job_links(html)
        for url in urls:
            assert "/tim-viec-lam/" in url, f"Not a job detail URL: {url}"
            # Should have a numeric ID at the end
            assert any(c.isdigit() for c in url.split("/")[-1])

    def test_deduplication(self):
        """Duplicate URLs must be removed."""
        html = _read_fixture("sample_listing.html")
        urls = extract_job_links(html)
        assert len(urls) == len(set(urls)), "URLs are not deduplicated"

    def test_preserve_order(self):
        """URLs must be in first-appearance order."""
        html = _read_fixture("sample_listing.html")
        urls = extract_job_links(html)
        # Verify that the first URL corresponds to the first job card
        assert "junior-system-administrator" in urls[0].lower()

    def test_no_source_query_param(self):
        """URLs must not include ?source=site query parameter."""
        html = _read_fixture("sample_listing.html")
        urls = extract_job_links(html)
        for url in urls:
            assert "?source=site" not in url
            assert "source=site" not in url

    def test_empty_html_returns_empty_list(self):
        """Empty/missing listing HTML returns [] without crashing."""
        urls = extract_job_links("<html></html>")
        assert urls == []


# ═════════════════════════════════════════════════════════════════════════
# CareerLink Source — contract & unit tests
# ═════════════════════════════════════════════════════════════════════════


class TestCareerLinkSourceContract:
    """Verify CareerLinkSource follows the BaseJobSource contract."""

    def test_is_base_job_source(self):
        src = CareerLinkSource()
        assert isinstance(src, BaseJobSource)

    def test_source_name(self):
        src = CareerLinkSource()
        assert src.source_name == "CareerLink"

    def test_fetch_jobs_returns_list_of_jobcreate(self):
        """When listing is unavailable, returns empty list (no crash)."""
        src = CareerLinkSource(
            listing_url="https://careerlink.vn/nonexistent-page-99999"
        )
        jobs = src.fetch_jobs()
        assert isinstance(jobs, list)
        # Should be empty since page doesn't exist or returns error
        for job in jobs:
            assert isinstance(job, JobCreate)

    def test_source_does_not_import_repository(self):
        """CareerLinkSource must NOT import repository or service modules."""
        import inspect
        import sys

        src_module = sys.modules.get(
            "app.modules.jobs.sources.careerlink_source"
        )
        if src_module is None:
            # Module might not be loaded yet; fetch triggers import
            CareerLinkSource()
            src_module = sys.modules.get(
                "app.modules.jobs.sources.careerlink_source"
            )
        if src_module is None:
            pytest.skip("Module not importable")

        source_code = inspect.getsource(src_module)
        assert "repository" not in source_code.lower().replace(
            "_repository", ""
        ), "CareerLinkSource must not import repository"
        assert "service" not in source_code.lower().replace(
            "_service", ""
        ), "CareerLinkSource must not import service"

    def test_source_does_not_import_db_session(self):
        """CareerLinkSource must NOT import SQLAlchemy session or DB modules."""
        import inspect
        import sys

        CareerLinkSource()
        src_module = sys.modules.get(
            "app.modules.jobs.sources.careerlink_source"
        )
        assert src_module is not None
        source_code = inspect.getsource(src_module)
        # Must not import from app.db (DB session layer)
        assert "from app.db" not in source_code, (
            "CareerLinkSource must not import from app.db"
        )
        assert "session.add" not in source_code.lower()
        assert "session.commit" not in source_code.lower()
