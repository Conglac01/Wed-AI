"""JobService — business logic layer."""

from sqlalchemy.orm import Session

from app.modules.jobs.repository import JobRepository
from app.modules.jobs.schema import JobCreate, JobListResponse, JobListItem, JobRead


class JobService:
    """Job domain logic. Delegates persistence to JobRepository."""

    def __init__(self, db: Session):
        self.repo = JobRepository(db)

    # ------------------------------------------------------------------
    # Read — single
    # ------------------------------------------------------------------

    def get_job(self, job_id: int) -> JobRead | None:
        """Return a single job by id.  Returns None for inactive / deleted."""
        job = self.repo.get_by_id(job_id)
        if job is None:
            return None
        return JobRead.model_validate(job)

    # ------------------------------------------------------------------
    # Read — list
    # ------------------------------------------------------------------

    def list_jobs(
        self,
        *,
        keyword: str | None = None,
        location: str | None = None,
        skill: str | None = None,
        page: int = 1,
        limit: int = 20,
    ) -> JobListResponse:
        """Return a paginated list of jobs with optional filters."""

        if page < 1:
            raise ValueError("page must be >= 1")
        if limit < 1 or limit > 100:
            raise ValueError("limit must be between 1 and 100")

        rows, total = self.repo.list_jobs(
            keyword=keyword,
            location=location,
            skill=skill,
            page=page,
            limit=limit,
        )

        items = [JobListItem.model_validate(r) for r in rows]

        return JobListResponse(items=items, total=total, page=page, limit=limit)

    # ------------------------------------------------------------------
    # Write
    # ------------------------------------------------------------------

    def create_job(
        self, data: JobCreate, *, quality_score: float = 0.0
    ) -> JobRead:
        """Insert a new job with an optional quality score."""
        job = self.repo.create(data, quality_score=quality_score)
        return JobRead.model_validate(job)
