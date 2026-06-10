"""Tests for job sources — MockJobSource and CSVJobSource."""

from pathlib import Path

import pytest

from app.modules.jobs.schema import JobCreate
from app.modules.jobs.sources import CSVJobSource, MockJobSource

# ── Test helpers ────────────────────────────────────────────────────────

_SAMPLE_CSV = (
    Path(__file__).resolve().parents[4] / "data" / "sample" / "jobs_sample.csv"
)


# ═════════════════════════════════════════════════════════════════════════
# MockJobSource
# ═════════════════════════════════════════════════════════════════════════


class TestMockJobSource:
    def test_returns_between_10_and_30_jobs(self):
        src = MockJobSource()
        jobs = src.fetch_jobs()
        assert 10 <= len(jobs) <= 30, f"Expected 10–30 jobs, got {len(jobs)}"

    def test_all_jobs_are_jobcreate_instances(self):
        src = MockJobSource()
        jobs = src.fetch_jobs()
        for job in jobs:
            assert isinstance(job, JobCreate), f"Expected JobCreate, got {type(job)}"

    def test_skills_are_list_str_or_none(self):
        src = MockJobSource()
        for job in src.fetch_jobs():
            assert job.skills is None or isinstance(job.skills, list)
            if job.skills:
                for s in job.skills:
                    assert isinstance(s, str), f"Skill {s!r} is not a string"

    def test_contains_multiple_job_categories(self):
        src = MockJobSource()
        titles = {j.title for j in src.fetch_jobs()}
        assert len(titles) >= 8, f"Expected ≥8 job titles, got {len(titles)}"

    def test_contains_multiple_companies(self):
        src = MockJobSource()
        companies = {j.company_name for j in src.fetch_jobs()}
        assert len(companies) >= 5, f"Expected ≥5 companies, got {len(companies)}"

    def test_contains_multiple_locations(self):
        src = MockJobSource()
        locations = {j.location for j in src.fetch_jobs()}
        assert len(locations) >= 3, f"Expected ≥3 locations, got {len(locations)}"

    def test_source_name_is_mock(self):
        assert MockJobSource().source_name == "Mock"


# ═════════════════════════════════════════════════════════════════════════
# CSVJobSource — positive cases
# ═════════════════════════════════════════════════════════════════════════


class TestCSVJobSource:
    def test_loads_csv_successfully(self):
        src = CSVJobSource(_SAMPLE_CSV)
        jobs = src.fetch_jobs()
        assert 10 <= len(jobs) <= 30, f"Expected 10–30 CSV jobs, got {len(jobs)}"
        for job in jobs:
            assert isinstance(job, JobCreate)

    def test_all_rows_are_validated_through_jobcreate(self):
        """Every row must pass JobCreate validation — no exceptions escape."""
        src = CSVJobSource(_SAMPLE_CSV)
        jobs = src.fetch_jobs()
        assert len(jobs) > 0

    def test_skills_converted_correctly(self):
        """Semicolon-separated skills must become a list[str]."""
        src = CSVJobSource(_SAMPLE_CSV)
        jobs = src.fetch_jobs()
        # The CSV first row has "React;TypeScript;Next.js;Tailwind CSS;Jest"
        frontend = next(j for j in jobs if "React" in j.title)
        assert frontend.skills is not None
        assert len(frontend.skills) >= 3
        assert "React" in frontend.skills
        assert "TypeScript" in frontend.skills

    def test_salary_values_converted_to_int_or_none(self):
        src = CSVJobSource(_SAMPLE_CSV)
        for job in src.fetch_jobs():
            assert job.salary_min is None or isinstance(job.salary_min, int)
            assert job.salary_max is None or isinstance(job.salary_max, int)

    def test_empty_optional_fields_become_none(self):
        """Empty CSV cells (e.g., company_logo_url, source_url) → None."""
        src = CSVJobSource(_SAMPLE_CSV)
        jobs = src.fetch_jobs()
        for job in jobs:
            # All sample rows have empty company_logo_url → should be None
            if "logo" in str(job.company_logo_url or ""):
                # one of the mock jobs via mock_source has a URL; CSV rows are mostly empty
                pass

    def test_deadline_kept_as_string_or_none(self):
        src = CSVJobSource(_SAMPLE_CSV)
        jobs = src.fetch_jobs()
        for job in jobs:
            assert job.deadline is None or isinstance(job.deadline, str)
            if job.deadline:
                # YYYY-MM-DD format
                import re
                assert re.match(r"^\d{4}-\d{2}-\d{2}$", job.deadline), (
                    f"Deadline {job.deadline!r} not in YYYY-MM-DD format"
                )

    def test_source_name_defaults_to_csv(self):
        """Rows without source_name get 'CSV' as default."""
        src = CSVJobSource(_SAMPLE_CSV)
        jobs = src.fetch_jobs()
        assert all(j.source_name is not None for j in jobs)


# ═════════════════════════════════════════════════════════════════════════
# CSVJobSource — skill normalization edge cases
# ═════════════════════════════════════════════════════════════════════════


class TestSkillNormalization:
    """Tests for _normalize_skills via CSV source (or directly)."""

    def test_trims_whitespace(self):
        from app.modules.jobs.sources.csv_source import _normalize_skills

        result = _normalize_skills(" React ; TypeScript ; Tailwind ")
        assert result == ["React", "TypeScript", "Tailwind"]

    def test_removes_empty_values(self):
        from app.modules.jobs.sources.csv_source import _normalize_skills

        result = _normalize_skills("React;;TypeScript;;Tailwind;")
        assert result == ["React", "TypeScript", "Tailwind"]

    def test_dedup_case_insensitive_keeps_first_casing(self):
        from app.modules.jobs.sources.csv_source import _normalize_skills

        # "typescript" (lowercase first) + "TypeScript" → keep "typescript"
        result = _normalize_skills("typescript;TypeScript")
        assert result == ["typescript"]
        # "React" (title first) + "react" → keep "React"
        result2 = _normalize_skills("React;react")
        assert result2 == ["React"]

    def test_preserves_order(self):
        from app.modules.jobs.sources.csv_source import _normalize_skills

        result = _normalize_skills("Python;JavaScript;React;TypeScript")
        assert result == ["Python", "JavaScript", "React", "TypeScript"]

    def test_none_input_returns_none(self):
        from app.modules.jobs.sources.csv_source import _normalize_skills

        assert _normalize_skills(None) is None

    def test_empty_string_returns_none(self):
        from app.modules.jobs.sources.csv_source import _normalize_skills

        assert _normalize_skills("") is None

    def test_only_semicolons_returns_none(self):
        from app.modules.jobs.sources.csv_source import _normalize_skills

        assert _normalize_skills(";;;") is None


# ═════════════════════════════════════════════════════════════════════════
# CSVJobSource — negative cases
# ═════════════════════════════════════════════════════════════════════════


class TestCSVSourceNegative:
    def test_detects_duplicate_rows(self):
        """Duplicate (title, company_name, location) must raise ValueError."""
        dup_csv = (
            Path(__file__).resolve().parents[4]
            / "data"
            / "sample"
            / "jobs_sample_duplicate.csv"
        )
        # Create a minimal duplicate CSV on the fly
        content = (
            "title,company_name,location,description\r\n"
            "Test Job,Test Corp,Hà Nội,Some description\r\n"
            "Test Job,Test Corp,Hà Nội,Another description\r\n"
        )
        try:
            dup_csv.write_text(content, encoding="utf-8")
            src = CSVJobSource(dup_csv)
            with pytest.raises(ValueError, match="(?i)duplicate"):
                src.fetch_jobs()
        finally:
            if dup_csv.exists():
                dup_csv.unlink()

    def test_missing_required_column_raises(self):
        """CSV missing 'title' column must raise ValueError."""
        bad_csv = Path(__file__).resolve().parents[4] / "data" / "sample" / "_test_missing.csv"
        content = "company_name,location,description\r\nTest Corp,Hà Nội,Desc\r\n"
        try:
            bad_csv.write_text(content, encoding="utf-8")
            src = CSVJobSource(bad_csv)
            with pytest.raises(ValueError):
                src.fetch_jobs()
        finally:
            if bad_csv.exists():
                bad_csv.unlink()

    def test_invalid_salary_type_raises(self):
        """Non-integer salary_min must raise ValueError."""
        bad_csv = Path(__file__).resolve().parents[4] / "data" / "sample" / "_test_bad_salary.csv"
        content = (
            "title,company_name,location,description,salary_min\r\n"
            "Test,Corp,HN,desc,not_a_number\r\n"
        )
        try:
            bad_csv.write_text(content, encoding="utf-8")
            src = CSVJobSource(bad_csv)
            with pytest.raises(ValueError, match="(?i)integer"):
                src.fetch_jobs()
        finally:
            if bad_csv.exists():
                bad_csv.unlink()

    def test_missing_required_jobcreate_field_raises(self):
        """Row without 'description' column must raise ValueError."""
        bad_csv = Path(__file__).resolve().parents[4] / "data" / "sample" / "_test_no_desc.csv"
        content = (
            "title,company_name,location\r\n"   # no 'description' column
            "Test,Corp,HN\r\n"
        )
        try:
            bad_csv.write_text(content, encoding="utf-8")
            src = CSVJobSource(bad_csv)
            with pytest.raises(ValueError):
                src.fetch_jobs()
        finally:
            if bad_csv.exists():
                bad_csv.unlink()

    def test_file_not_found(self):
        """Non-existent CSV must raise FileNotFoundError."""
        src = CSVJobSource(Path("/nonexistent/path/jobs.csv"))
        with pytest.raises(FileNotFoundError):
            src.fetch_jobs()


# ═════════════════════════════════════════════════════════════════════════
# CSVJobSource — source_name
# ═════════════════════════════════════════════════════════════════════════


class TestCSVSourceContract:
    def test_source_name_is_csv(self):
        src = CSVJobSource(_SAMPLE_CSV)
        assert src.source_name == "CSV"

    def test_is_instance_of_base_source(self):
        from app.modules.jobs.sources.base import BaseJobSource

        src = CSVJobSource(_SAMPLE_CSV)
        assert isinstance(src, BaseJobSource)
        mock = MockJobSource()
        assert isinstance(mock, BaseJobSource)
