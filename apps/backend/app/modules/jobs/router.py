"""Jobs router — skeleton only in Phase 2.1."""

from fastapi import APIRouter

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.get("/health")
async def jobs_health():
    """Simple health indicator for the jobs module."""
    return {"module": "jobs", "status": "ok"}
