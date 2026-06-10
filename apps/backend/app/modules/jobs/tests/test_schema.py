"""Minimal schema tests for the Jobs module."""

import pytest

from app.modules.jobs.schema import JobCreate, JobRead, JobUpdate, JobListItem


class TestJobCreate:
    def test_required_fields_validate(self):
        """JobCreate requires title, company_name, location, description."""
        job = JobCreate(
            title="Backend Developer",
            company_name="Tech Corp",
            location="Hồ Chí Minh",
            description="Build APIs with FastAPI",
        )
        assert job.title == "Backend Developer"
        assert job.company_name == "Tech Corp"
        assert job.location == "Hồ Chí Minh"
        assert job.description == "Build APIs with FastAPI"

    def test_optional_fields_default_to_none(self):
        """Optional fields should default to None."""
        job = JobCreate(
            title="Backend Developer",
            company_name="Tech Corp",
            location="Hồ Chí Minh",
            description="Build APIs with FastAPI",
        )
        assert job.salary_text is None
        assert job.salary_min is None
        assert job.skills is None

    def test_skills_accepts_list_of_strings(self):
        """Skills field should accept list[str]."""
        job = JobCreate(
            title="Backend Developer",
            company_name="Tech Corp",
            location="Hồ Chí Minh",
            description="Build APIs with FastAPI",
            skills=["Python", "FastAPI", "PostgreSQL"],
        )
        assert job.skills == ["Python", "FastAPI", "PostgreSQL"]

    def test_skills_none_is_valid(self):
        """Skills field should accept None."""
        job = JobCreate(
            title="Backend Developer",
            company_name="Tech Corp",
            location="Hồ Chí Minh",
            description="Build APIs with FastAPI",
            skills=None,
        )
        assert job.skills is None


class TestJobUpdate:
    def test_accepts_partial_data(self):
        """JobUpdate should accept partial data — all fields optional."""
        update = JobUpdate(title="Updated Title")
        assert update.title == "Updated Title"
        assert update.company_name is None

    def test_empty_update_is_valid(self):
        """JobUpdate with no fields should be valid."""
        update = JobUpdate()
        assert update.title is None


class TestJobRead:
    def test_can_create_from_sample_data(self):
        """JobRead should accept all required fields."""
        data = {
            "id": 1,
            "title": "Backend Developer",
            "company_name": "Tech Corp",
            "company_logo_url": None,
            "location": "Hồ Chí Minh",
            "salary_text": "Thương lượng",
            "salary_min": None,
            "salary_max": None,
            "skills": ["Python", "FastAPI"],
            "description": "Build APIs",
            "requirements": "3+ years experience",
            "benefits": "Health insurance",
            "deadline": "2026-07-01",
            "source_name": None,
            "source_url": None,
            "quality_score": 0.0,
            "is_active": True,
            "created_at": "2026-06-11T00:00:00",
            "updated_at": "2026-06-11T00:00:00",
        }
        job = JobRead(**data)
        assert job.id == 1
        assert job.title == "Backend Developer"
        assert job.skills == ["Python", "FastAPI"]


class TestJobListItem:
    def test_does_not_require_full_detail_fields(self):
        """JobListItem should be lightweight — no description, requirements, etc."""
        data = {
            "id": 1,
            "title": "Backend Developer",
            "company_name": "Tech Corp",
            "company_logo_url": None,
            "location": "Hồ Chí Minh",
            "salary_text": None,
            "skills": None,
            "quality_score": 0.0,
            "is_active": True,
            "created_at": "2026-06-11T00:00:00",
        }
        item = JobListItem(**data)
        assert item.id == 1
        assert item.title == "Backend Developer"
        # Confirm lightweight fields present
        assert item.company_name == "Tech Corp"
        # Confirm heavy fields absent from schema
        assert not hasattr(item, "description")
        assert not hasattr(item, "requirements")
        assert not hasattr(item, "benefits")
