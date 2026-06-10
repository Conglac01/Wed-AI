"""JobService — business logic layer. Skeleton only in Phase 2.1."""

# TODO Phase 2.2: Add job listing, search, and CRUD operations

from sqlalchemy.orm import Session

from app.modules.jobs.repository import JobRepository
from app.modules.jobs.schema import JobRead


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
