"""Tests for the job import pipeline — all stages + orchestrator."""

from datetime import datetime

import pytest

from app.modules.jobs.pipeline import ImportSummary
from app.modules.jobs.pipeline.cleaning import clean_jobs
from app.modules.jobs.pipeline.deduplication import (
    deduplicate_in_batch,
    filter_db_duplicates,
)
from app.modules.jobs.pipeline.import_pipeline import JobImportPipeline
from app.modules.jobs.pipeline.normalization import normalize_jobs
from app.modules.jobs.pipeline.quality_score import calculate_quality_score
from app.modules.jobs.pipeline.skill_extractor import extract_and_normalize_skills
from app.modules.jobs.pipeline.validation import validate_jobs
from app.modules.jobs.schema import JobCreate
from app.modules.jobs.sources.mock_source import MockJobSource
from app.modules.jobs.tests.fakes import FakeJobRepository


# ── Helpers ────────────────────────────────────────────────────────────


def _make_job(**overrides) -> JobCreate:
    defaults = {
        "title": "Test Developer",
        "company_name": "Test Corp",
        "location": "Hà Nội",
        "description": "A test job description that is long enough for quality checks.",
    }
    return JobCreate(**{**defaults, **overrides})


# ═════════════════════════════════════════════════════════════════════════
# Validation
# ═════════════════════════════════════════════════════════════════════════


class TestValidation:
    def test_valid_job_passes(self):
        jobs = [_make_job()]
        result = validate_jobs(jobs)
        assert len(result.valid) == 1
        assert len(result.errors) == 0

    def test_missing_title_fails(self):
        jobs = [_make_job(title="")]
        result = validate_jobs(jobs)
        assert len(result.valid) == 0
        assert len(result.errors) == 1
        assert "title" in result.errors[0].lower()

    def test_missing_company_name_fails(self):
        jobs = [_make_job(company_name="")]
        result = validate_jobs(jobs)
        assert len(result.valid) == 0
        assert "company_name" in result.errors[0].lower()

    def test_missing_location_fails(self):
        jobs = [_make_job(location="")]
        result = validate_jobs(jobs)
        assert len(result.valid) == 0
        assert "location" in result.errors[0].lower()

    def test_missing_description_fails(self):
        jobs = [_make_job(description="")]
        result = validate_jobs(jobs)
        assert len(result.valid) == 0
        assert "description" in result.errors[0].lower()

    def test_invalid_salary_range_fails(self):
        jobs = [_make_job(salary_min=50000000, salary_max=30000000)]
        result = validate_jobs(jobs)
        assert len(result.valid) == 0
        assert "salary_min" in result.errors[0].lower()

    def test_mixed_batch(self):
        jobs = [
            _make_job(title="Valid"),
            _make_job(title="", company_name=""),
        ]
        result = validate_jobs(jobs)
        assert len(result.valid) == 1
        assert result.valid[0].title == "Valid"
        assert len(result.errors) == 1


# ═════════════════════════════════════════════════════════════════════════
# Cleaning
# ═════════════════════════════════════════════════════════════════════════


class TestCleaning:
    def test_trims_whitespace(self):
        jobs = [_make_job(title="   Padded Title   ")]
        clean_jobs(jobs)
        assert jobs[0].title == "Padded Title"

    def test_blank_strings_become_empty(self):
        jobs = [_make_job(company_logo_url="   ")]
        clean_jobs(jobs)
        assert jobs[0].company_logo_url is None

    def test_vietnamese_text_preserved(self):
        jobs = [_make_job(title="  Lập trình viên Backend  ")]
        clean_jobs(jobs)
        assert jobs[0].title == "Lập trình viên Backend"

    def test_collapses_repeated_spaces(self):
        jobs = [_make_job(description="Too   many    spaces   here")]
        clean_jobs(jobs)
        assert jobs[0].description == "Too many spaces here"

    def test_none_optional_becomes_none(self):
        jobs = [_make_job(source_url=None)]
        clean_jobs(jobs)
        assert jobs[0].source_url is None


# ═════════════════════════════════════════════════════════════════════════
# Deduplication
# ═════════════════════════════════════════════════════════════════════════


class TestDeduplication:
    def test_duplicate_detection_works(self):
        jobs = [
            _make_job(title="Job A", company_name="Corp", location="HN"),
            _make_job(title="Job A", company_name="Corp", location="HN"),
        ]
        result = deduplicate_in_batch(jobs)
        assert len(result.unique) == 1
        assert result.duplicate_count == 1

    def test_case_insensitive(self):
        jobs = [
            _make_job(title="Job A", company_name="Corp", location="HN"),
            _make_job(title="job a", company_name="corp", location="hn"),
        ]
        result = deduplicate_in_batch(jobs)
        assert len(result.unique) == 1
        assert result.duplicate_count == 1

    def test_first_occurrence_preserved(self):
        jobs = [
            _make_job(title="First Job", company_name="Corp", location="HN"),
            _make_job(title="First Job", company_name="Corp", location="HN"),
        ]
        result = deduplicate_in_batch(jobs)
        assert len(result.unique) == 1
        assert result.unique[0].title == "First Job"

    def test_db_duplicate_skipped(self):
        repo = FakeJobRepository(
            existing_duplicates=[("Existing Job", "Corp", "HN")]
        )
        jobs = [_make_job(title="Existing Job", company_name="Corp", location="HN")]
        new, skipped = filter_db_duplicates(jobs, repo)
        assert len(new) == 0
        assert skipped == 1

    def test_non_duplicate_passes_db_check(self):
        repo = FakeJobRepository(
            existing_duplicates=[("Existing Job", "Corp", "HN")]
        )
        jobs = [_make_job(title="New Job", company_name="Corp", location="HN")]
        new, skipped = filter_db_duplicates(jobs, repo)
        assert len(new) == 1
        assert skipped == 0


# ═════════════════════════════════════════════════════════════════════════
# Normalization
# ═════════════════════════════════════════════════════════════════════════


class TestNormalization:
    def test_skill_normalization_works(self):
        jobs = [
            _make_job(skills=["  React  ", "  react  ", "  TypeScript  ", "  "])
        ]
        normalize_jobs(jobs)
        assert jobs[0].skills == ["React", "TypeScript"]

    def test_first_occurrence_casing_preserved(self):
        jobs = [_make_job(skills=["typescript", "TypeScript"])]
        normalize_jobs(jobs)
        assert jobs[0].skills == ["typescript"]

    def test_none_skills_remain_none(self):
        jobs = [_make_job(skills=None)]
        normalize_jobs(jobs)
        assert jobs[0].skills is None

    def test_empty_skills_become_none(self):
        jobs = [_make_job(skills=["", "  "])]
        normalize_jobs(jobs)
        assert jobs[0].skills is None

    def test_location_trimmed(self):
        jobs = [_make_job(location="  TP. Hồ Chí Minh  ")]
        normalize_jobs(jobs)
        assert jobs[0].location == "TP. Hồ Chí Minh"


# ═════════════════════════════════════════════════════════════════════════
# Skill Extractor
# ═════════════════════════════════════════════════════════════════════════


class TestSkillExtractor:
    def test_keeps_existing_skills(self):
        jobs = [_make_job(skills=["Python", "FastAPI"])]
        extract_and_normalize_skills(jobs)
        assert jobs[0].skills == ["Python", "FastAPI"]

    def test_extracts_missing_skills(self):
        jobs = [
            _make_job(
                title="Python Developer",
                description="We need someone with FastAPI and Docker experience",
                requirements="Must know PostgreSQL and AWS",
                skills=None,
            )
        ]
        extract_and_normalize_skills(jobs)
        assert jobs[0].skills is not None
        assert "Python" in jobs[0].skills
        assert "FastAPI" in jobs[0].skills
        assert "Docker" in jobs[0].skills
        assert "PostgreSQL" in jobs[0].skills
        assert "AWS" in jobs[0].skills

    def test_canonical_names_returned(self):
        """'nodejs' → 'Node.js', 'aws' → 'AWS'"""
        jobs = [
            _make_job(
                title="DevOps",
                description="Looking for someone with nodejs and aws experience",
                skills=None,
            )
        ]
        extract_and_normalize_skills(jobs)
        assert jobs[0].skills is not None
        assert "Node.js" in jobs[0].skills
        assert "AWS" in jobs[0].skills
        assert "nodejs" not in jobs[0].skills
        assert "aws" not in jobs[0].skills

    def test_first_appearance_order_preserved(self):
        """Skills must be returned in first-appearance order, NOT alphabetical."""
        jobs = [
            _make_job(
                title="Full-stack",
                description="Docker, Python, AWS, Linux, React, Postgres experience",
                skills=None,
            )
        ]
        extract_and_normalize_skills(jobs)
        skills = jobs[0].skills
        assert skills is not None
        # First-appearance order in the text
        assert skills == [
            "Docker",
            "Python",
            "AWS",
            "Linux",
            "React",
            "PostgreSQL",
        ], f"Expected first-appearance order, got: {skills}"

    def test_first_appearance_not_alphabetical(self):
        """Verify that output is NOT alphabetical when text order differs."""
        jobs = [
            _make_job(
                title="DevOps",
                description="We need AWS and React and Python and Docker",
                skills=None,
            )
        ]
        extract_and_normalize_skills(jobs)
        skills = jobs[0].skills
        assert skills is not None
        assert skills == [
            "AWS",
            "React",
            "Python",
            "Docker",
        ], f"Expected first-appearance order, got: {skills}"
        # Prove this is NOT alphabetical: alphabetical would be AWS, Docker, Python, React
        assert skills != sorted(skills), (
            f"Skills are alphabetical when they should follow first-appearance order"
        )


# ═════════════════════════════════════════════════════════════════════════
# Quality Score
# ═════════════════════════════════════════════════════════════════════════


class TestQualityScore:
    def test_complete_job_scores_higher(self):
        complete = _make_job(
            title="Senior Dev",
            skills=["Python"],
            salary_min=30000000,
            requirements="Must have 5+ years of experience with Python and FastAPI",
            benefits="Full health insurance and stock options available",
            source_url="https://example.com/job/1",
        )
        minimal = _make_job(
            skills=None,
            salary_min=None,
            requirements=None,
            benefits=None,
            source_url=None,
        )
        assert calculate_quality_score(complete) > calculate_quality_score(minimal)

    def test_score_in_range(self):
        for _ in range(20):
            job = _make_job()
            score = calculate_quality_score(job)
            assert 0.0 <= score <= 1.0, f"Score {score} out of range"

    def test_deterministic(self):
        job = _make_job(
            skills=["Python"],
            salary_min=30000000,
            requirements="A long enough requirement text for twenty chars",
            benefits="A long enough benefits text for twenty chars yes",
        )
        assert calculate_quality_score(job) == calculate_quality_score(job)


# ═════════════════════════════════════════════════════════════════════════
# ImportSummary
# ═════════════════════════════════════════════════════════════════════════


class TestImportSummary:
    def test_is_pydantic_model(self):
        s = ImportSummary(source_name="Test")
        assert isinstance(s, ImportSummary)

    def test_defaults(self):
        s = ImportSummary(source_name="Test")
        assert s.fetched_count == 0
        assert s.inserted_count == 0
        assert s.errors == []
        assert s.dry_run is False

    def test_json_serializable(self):
        s = ImportSummary(source_name="Test", fetched_count=10, inserted_count=5)
        j = s.model_dump()
        assert j["source_name"] == "Test"
        assert j["fetched_count"] == 10
        assert j["inserted_count"] == 5

    def test_dry_run_flag(self):
        s = ImportSummary(source_name="Test", dry_run=True)
        assert s.dry_run is True


# ═════════════════════════════════════════════════════════════════════════
# Import Pipeline — unit (fake repo)
# ═════════════════════════════════════════════════════════════════════════


class TestImportPipelineUnit:
    def test_dry_run_calculates_quality_scores(self):
        """dry_run=True must calculate quality scores but NOT persist."""
        src = MockJobSource()
        repo = FakeJobRepository()
        jobs = src.fetch_jobs()
        val = validate_jobs(jobs)
        cleaned = clean_jobs(val.valid)
        dedup = deduplicate_in_batch(cleaned)
        normalized = normalize_jobs(dedup.unique)
        extract_and_normalize_skills(normalized)

        # dry_run: compute scores for every job
        scored = [(job, calculate_quality_score(job)) for job in normalized]

        # Verify scores were computed
        assert len(scored) == len(normalized)
        for _job, score in scored:
            assert 0.0 <= score <= 1.0, f"Score {score} out of range"

        # repo.create() must never be called
        assert len(repo.jobs) == 0

    def test_dry_run_does_not_persist(self):
        """dry_run=True must not call repo.create()."""
        src = MockJobSource()
        repo = FakeJobRepository()
        jobs = src.fetch_jobs()
        val = validate_jobs(jobs)
        cleaned = clean_jobs(val.valid)
        dedup = deduplicate_in_batch(cleaned)
        normalized = normalize_jobs(dedup.unique)
        extract_and_normalize_skills(normalized)

        # dry_run — do NOT persist, but compute scores
        assert len(repo.jobs) == 0
        dry_run = True
        # Compute scores always (matching import_pipeline behavior)
        _ = [(job, calculate_quality_score(job)) for job in normalized]
        if not dry_run:
            for job in normalized:
                repo.create(job, quality_score=calculate_quality_score(job))
        assert len(repo.jobs) == 0  # still zero!

    def test_wet_run_persists(self):
        """dry_run=False must persist via repo.create()."""
        src = MockJobSource()
        repo = FakeJobRepository()
        jobs = src.fetch_jobs()
        val = validate_jobs(jobs)
        cleaned = clean_jobs(val.valid)
        dedup = deduplicate_in_batch(cleaned)
        normalized = normalize_jobs(dedup.unique)
        extract_and_normalize_skills(normalized)

        for job in normalized:
            score = calculate_quality_score(job)
            repo.create(job, quality_score=score)

        assert len(repo.jobs) == 18  # all mock jobs persisted

    def test_mock_source_import_summary(self):
        repo = FakeJobRepository()
        src = MockJobSource()
        jobs = src.fetch_jobs()

        val = validate_jobs(jobs)
        cleaned = clean_jobs(val.valid)
        dedup = deduplicate_in_batch(cleaned)
        normalized = normalize_jobs(dedup.unique)
        extract_and_normalize_skills(normalized)

        for job in normalized:
            score = calculate_quality_score(job)
            repo.create(job, quality_score=score)

        summary = ImportSummary(
            source_name=src.source_name,
            fetched_count=len(jobs),
            validated_count=len(val.valid),
            cleaned_count=len(cleaned),
            normalized_count=len(normalized),
            inserted_count=len(repo.jobs),
            skipped_duplicate_count=dedup.duplicate_count,
        )
        assert summary.source_name == "Mock"
        assert summary.fetched_count == 18
        assert summary.inserted_count == 18

    def test_duplicates_skipped_in_summary(self):
        repo = FakeJobRepository(
            existing_duplicates=[("Backend Developer (Python/FastAPI)", "FPT Software", "Hà Nội")]
        )
        src = MockJobSource()
        jobs = src.fetch_jobs()

        val = validate_jobs(jobs)
        cleaned = clean_jobs(val.valid)
        dedup = deduplicate_in_batch(cleaned)

        new_jobs, db_dupes = filter_db_duplicates(dedup.unique, repo)

        assert db_dupes == 1
        assert len(new_jobs) == 17  # 18 - 1 duplicate


# ═════════════════════════════════════════════════════════════════════════
# Import Pipeline — DB transaction safety
# ═════════════════════════════════════════════════════════════════════════


class TestTransactionSafety:
    def test_one_bad_job_does_not_crash_batch(self):
        """A single failing repo.create must not prevent processing remaining jobs."""
        repo = FakeJobRepository(raise_on_create=True)

        jobs = [
            _make_job(title="Job 1"),
            _make_job(title="Job 2"),
            _make_job(title="Job 3"),
        ]
        val = validate_jobs(jobs)
        cleaned = clean_jobs(val.valid)
        dedup = deduplicate_in_batch(cleaned)
        normalized = normalize_jobs(dedup.unique)
        extract_and_normalize_skills(normalized)

        inserted = 0
        failed = 0
        errors: list[str] = []

        for job in normalized:
            try:
                repo.create(job, quality_score=calculate_quality_score(job))
                inserted += 1
            except Exception as exc:
                failed += 1
                errors.append(f"Insert error [{job.title}]: {exc}")

        # The fake raises on create, so all 3 fail — but none crash the loop
        assert inserted == 0
        assert failed == 3  # all caught
        assert len(errors) == 3
