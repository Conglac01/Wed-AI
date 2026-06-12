"""Central API router — aggregates all sub-routers."""

from fastapi import APIRouter

from app.modules.cv.router import router as cv_router
from app.modules.identity.router import router as identity_router
from app.modules.jobs.router import router as jobs_router

api_router = APIRouter(prefix="/api/v1")

# Auth
api_router.include_router(identity_router)

# Jobs
api_router.include_router(jobs_router)

# CV — upload, parsing, analysis
api_router.include_router(cv_router)
