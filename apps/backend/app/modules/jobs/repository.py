"""JobRepository — database access layer. No business logic."""

from sqlalchemy.orm import Session

from app.modules.jobs.model import Job


class JobRepository:
    """Data access for the jobs table."""

    def __init__(self, db: Session):
        self.db = db

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    def get_by_id(self, job_id: int) -> Job | None:
        """Return a job by primary key, or None."""
        return self.db.query(Job).filter(Job.id == job_id).first()
