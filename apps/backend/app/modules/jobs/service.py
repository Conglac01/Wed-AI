"""JobService — business logic layer."""

from sqlalchemy.orm import Session

from app.modules.jobs.repository import JobRepository
from app.modules.jobs.schema import JobCreate, JobRead


class JobService:
    """Job domain logic. Delegates persistence to JobRepository."""

    def __init__(self, db: Session):
        self.repo = JobRepository(db)

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    def get_job_by_id(self, job_id: int) -> JobRead | None:
        job = self.repo.get_by_id(job_id)
        if job is None:
            return None
        return JobRead.model_validate(job)

    # ------------------------------------------------------------------
    # Write
    # ------------------------------------------------------------------

    def create_job(
        self, data: JobCreate, *, quality_score: float = 0.0
    ) -> JobRead:
        """Insert a new job with an optional quality score."""
        job = self.repo.create(data, quality_score=quality_score)
        return JobRead.model_validate(job)
