"""JobRepository — database access layer. No business logic."""

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.modules.jobs.model import Job
from app.modules.jobs.schema import JobCreate


class JobRepository:
    """Data access for the jobs table."""

    def __init__(self, db: Session):
        self.db = db

    # ------------------------------------------------------------------
    # Read — single
    # ------------------------------------------------------------------

    def get_by_id(self, job_id: int) -> Job | None:
        """Return an *active, non-deleted* job by primary key, or None."""
        return (
            self.db.query(Job)
            .filter(
                Job.id == job_id,
                Job.is_active == True,   # noqa: E712
                Job.deleted_at == None,  # noqa: E711
            )
            .first()
        )

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
    ) -> tuple[list[Job], int]:
        """Return a page of active, non-deleted jobs plus the total matching count.

        Filters are AND-ed together.  All string filters are case-insensitive.
        """

        base = (
            self.db.query(Job)
            .filter(
                Job.is_active == True,   # noqa: E712
                Job.deleted_at == None,  # noqa: E711
            )
        )

        # ── keyword → title OR company_name (ILIKE) ────────────
        if keyword:
            like = f"%{keyword}%"
            base = base.filter(
                Job.title.ilike(like) | Job.company_name.ilike(like)
            )

        # ── location → partial match (ILIKE) ──────────────────
        if location:
            base = base.filter(Job.location.ilike(f"%{location}%"))

        # ── skill → JSONB array element match (case-insensitive)
        if skill:
            base = base.filter(
                text(
                    "jobs.skills IS NOT NULL "
                    "AND jsonb_typeof(jobs.skills) = 'array' "
                    "AND EXISTS (SELECT 1 FROM jsonb_array_elements_text(jobs.skills) "
                    "AS elem WHERE lower(elem) = lower(:skill))"
                ).bindparams(skill=skill)
            )

        # ── Pagination ────────────────────────────────────────
        total = base.count()
        offset = (page - 1) * limit
        rows = base.order_by(Job.created_at.desc()).offset(offset).limit(limit).all()

        return rows, total

    # ------------------------------------------------------------------
    # Duplicate check (public for pipeline use)
    # ------------------------------------------------------------------

    def exists_active_duplicate(
        self, title: str, company_name: str, location: str
    ) -> bool:
        """Check whether an active job with the same key already exists."""
        exists = (
            self.db.query(Job)
            .filter(
                Job.title.ilike(title.strip()),
                Job.company_name.ilike(company_name.strip()),
                Job.location.ilike(location.strip()),
                Job.is_active == True,   # noqa: E712
                Job.deleted_at == None,  # noqa: E711
            )
            .first()
        )
        return exists is not None

    # ------------------------------------------------------------------
    # Write
    # ------------------------------------------------------------------

    def create(self, data: JobCreate, *, quality_score: float = 0.0) -> Job:
        """Insert a new job row. Caller provides quality_score separately."""
        job = Job(
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
        )
        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)
        return job
