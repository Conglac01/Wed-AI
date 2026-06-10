"""Fake repository for pipeline tests — no real database."""

from datetime import datetime, timezone

from app.modules.jobs.model import Job
from app.modules.jobs.schema import JobCreate


class FakeJobRepository:
    """In-memory fake for JobRepository used in pipeline unit tests."""

    def __init__(
        self,
        existing_duplicates: list[tuple[str, str, str]] | None = None,
        raise_on_create: bool = False,
    ):
        self.jobs: list[Job] = []
        self._dupes: set[tuple[str, str, str]] = set()
        self._next_id = 1
        self.raise_on_create = raise_on_create
        if existing_duplicates:
            for title, company, location in existing_duplicates:
                self._dupes.add((title.strip().lower(), company.strip().lower(), location.strip().lower()))

    def get_by_id(self, job_id: int) -> Job | None:
        for j in self.jobs:
            if j.id == job_id:
                return j
        return None

    def exists_active_duplicate(
        self, title: str, company_name: str, location: str
    ) -> bool:
        key = (
            title.strip().lower(),
            company_name.strip().lower(),
            location.strip().lower(),
        )
        return key in self._dupes

    def create(self, data: JobCreate, *, quality_score: float = 0.0) -> Job:
        if self.raise_on_create:
            raise RuntimeError("Simulated DB error")

        now = datetime.now(timezone.utc).replace(tzinfo=None)
        job = Job(
            id=self._next_id,
            title=data.title,
            company_name=data.company_name,
            company_logo_url=data.company_logo_url,
            location=data.location,
            salary_text=data.salary_text,
            salary_min=data.salary_min,
            salary_max=data.salary_max,
            skills=data.skills,
            description=data.description,
            requirements=data.requirements,
            benefits=data.benefits,
            deadline=data.deadline,
            source_name=data.source_name,
            source_url=data.source_url,
            quality_score=quality_score,
            is_active=True,
            created_at=now,
            updated_at=now,
        )
        self._next_id += 1
        self.jobs.append(job)
        return job
