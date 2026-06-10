"""Jobs router — read-only list + detail endpoints."""

from fastapi import APIRouter, Depends, Query
from fastapi.exceptions import HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.jobs.schema import JobListResponse, JobRead
from app.modules.jobs.service import JobService

router = APIRouter(prefix="/jobs", tags=["Jobs"])


def _svc(db: Session) -> JobService:
    return JobService(db)


# ── Static routes first (before /{job_id} to avoid path conflicts) ──


@router.get("/health")
async def jobs_health():
    """Simple health indicator for the jobs module."""
    return {"module": "jobs", "status": "ok"}


# ── GET /jobs — paginated list with optional filters ────────────────


@router.get("", response_model=JobListResponse)
def list_jobs(
    keyword: str | None = Query(None, description="Search title / company name"),
    location: str | None = Query(None, description="Filter by location (partial match)"),
    skill: str | None = Query(None, description="Filter by skill (case-insensitive)"),
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    limit: int = Query(20, ge=1, le=100, description="Items per page (max 100)"),
    db: Session = Depends(get_db),
):
    """Return a paginated list of active job listings."""
    try:
        return _svc(db).list_jobs(
            keyword=keyword,
            location=location,
            skill=skill,
            page=page,
            limit=limit,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


# ── GET /jobs/{job_id} — single job detail ──────────────────────────


@router.get("/{job_id}", response_model=JobRead)
def get_job(job_id: int, db: Session = Depends(get_db)):
    """Return a single job by id.  Returns 404 for inactive / deleted jobs."""
    job = _svc(db).get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
