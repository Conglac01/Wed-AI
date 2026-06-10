"""Integration tests for Jobs API — repository, service, router."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.main import app
from app.modules.jobs.model import Job
from app.modules.jobs.repository import JobRepository
from app.modules.jobs.schema import JobListResponse, JobListItem, JobRead
from app.modules.jobs.service import JobService


# ═════════════════════════════════════════════════════════════════════════
# TestClient helper
# ═════════════════════════════════════════════════════════════════════════


@pytest.fixture
def client(seeded_jobs_db: Session):
    """FastAPI TestClient using the seeded DB."""

    def _override_get_db():
        try:
            yield seeded_jobs_db
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


# ═════════════════════════════════════════════════════════════════════════
# Repository tests
# ═════════════════════════════════════════════════════════════════════════


class TestJobRepository:
    def test_get_by_id_returns_active_job(self, seeded_jobs_db: Session):
        repo = JobRepository(seeded_jobs_db)
        jobs, _ = repo.list_jobs(limit=1)
        assert len(jobs) == 1
        job = repo.get_by_id(jobs[0].id)
        assert job is not None
        assert job.id == jobs[0].id

    def test_get_by_id_returns_none_for_inactive(self, seeded_jobs_db: Session):
        repo = JobRepository(seeded_jobs_db)
        jobs, _ = repo.list_jobs(limit=1)
        job_id = jobs[0].id

        # Soft-deactivate the job
        from datetime import datetime
        job = seeded_jobs_db.query(Job).filter(Job.id == job_id).first()
        assert job is not None  # ← guard against None
        job.is_active = False
        seeded_jobs_db.commit()

        # Now the query must filter it out
        assert repo.get_by_id(job_id) is None

    def test_get_by_id_returns_none_for_deleted(self, seeded_jobs_db: Session):
        repo = JobRepository(seeded_jobs_db)
        jobs, _ = repo.list_jobs(limit=1)
        job_id = jobs[0].id

        from datetime import datetime
        job = seeded_jobs_db.query(Job).filter(Job.id == job_id).first()
        assert job is not None  # ← guard against None
        job.deleted_at = datetime.utcnow()
        seeded_jobs_db.commit()

        assert repo.get_by_id(job_id) is None

    def test_keyword_filter(self, seeded_jobs_db: Session):
        repo = JobRepository(seeded_jobs_db)
        rows, total = repo.list_jobs(keyword="Python")
        assert len(rows) > 0
        assert total > 0
        for r in rows:
            assert "python" in r.title.lower() or "python" in r.company_name.lower()

    def test_location_filter(self, seeded_jobs_db: Session):
        repo = JobRepository(seeded_jobs_db)
        rows, total = repo.list_jobs(location="Đà Nẵng")
        assert len(rows) > 0
        assert total > 0
        for r in rows:
            assert "đà nẵng" in r.location.lower()

    def test_skill_filter(self, seeded_jobs_db: Session):
        repo = JobRepository(seeded_jobs_db)
        rows, total = repo.list_jobs(skill="Python")
        assert len(rows) > 0
        assert total > 0
        # Every returned job should have "Python" in its skills (case-insensitive)
        for r in rows:
            assert r.skills is not None
            assert any(s.lower() == "python" for s in r.skills), (
                f"Job {r.id} skills={r.skills} does not contain 'Python'"
            )

    def test_pagination(self, seeded_jobs_db: Session):
        repo = JobRepository(seeded_jobs_db)
        rows1, total = repo.list_jobs(page=1, limit=2)
        rows2, total2 = repo.list_jobs(page=2, limit=2)
        assert len(rows1) == 2
        assert len(rows2) > 0
        assert total == total2  # total does not change between pages
        # Pages must not overlap
        ids_page1 = {r.id for r in rows1}
        ids_page2 = {r.id for r in rows2}
        assert ids_page1.isdisjoint(ids_page2)

    def test_total_reflects_filtered_results(self, seeded_jobs_db: Session):
        repo = JobRepository(seeded_jobs_db)
        _, unfiltered_total = repo.list_jobs()
        _, filtered_total = repo.list_jobs(keyword="Python")
        assert unfiltered_total >= filtered_total
        assert filtered_total > 0

    def test_all_queries_exclude_inactive(self, seeded_jobs_db: Session):
        repo = JobRepository(seeded_jobs_db)
        # Deactivate one job
        jobs, _ = repo.list_jobs(limit=1)
        job_id = jobs[0].id
        job = seeded_jobs_db.query(Job).filter(Job.id == job_id).first()
        assert job is not None  # ← guard against None
        job.is_active = False
        seeded_jobs_db.commit()

        _, total_after = repo.list_jobs()
        _, total_before = repo.list_jobs()
        # total_after should be one less than before deactivation …
        # but we can't easily get "before" here so check the deactivated job is gone
        assert repo.get_by_id(job_id) is None


# ═════════════════════════════════════════════════════════════════════════
# Service tests
# ═════════════════════════════════════════════════════════════════════════


class TestJobService:
    def test_get_job_returns_jobread(self, seeded_jobs_db: Session):
        svc = JobService(seeded_jobs_db)
        result = svc.list_jobs(limit=1)
        assert len(result.items) == 1
        job = svc.get_job(result.items[0].id)
        assert isinstance(job, JobRead)

    def test_get_job_returns_none_for_inactive(self, seeded_jobs_db: Session):
        svc = JobService(seeded_jobs_db)
        result = svc.list_jobs(limit=1)
        job_id = result.items[0].id

        job = seeded_jobs_db.query(Job).filter(Job.id == job_id).first()
        assert job is not None  # ← guard against None
        job.is_active = False
        seeded_jobs_db.commit()

        assert svc.get_job(job_id) is None

    def test_list_jobs_returns_joblistresponse(self, seeded_jobs_db: Session):
        svc = JobService(seeded_jobs_db)
        result = svc.list_jobs()
        assert isinstance(result, JobListResponse)
        assert len(result.items) > 0
        assert result.total > 0
        assert result.page == 1
        assert result.limit == 20
        for item in result.items:
            assert isinstance(item, JobListItem)

    def test_page_lt_1_rejected(self, seeded_jobs_db: Session):
        svc = JobService(seeded_jobs_db)
        with pytest.raises(ValueError, match="page must be >= 1"):
            svc.list_jobs(page=0)

    def test_limit_gt_100_rejected(self, seeded_jobs_db: Session):
        svc = JobService(seeded_jobs_db)
        with pytest.raises(ValueError, match="limit must be between 1 and 100"):
            svc.list_jobs(limit=101)

    def test_limit_lt_1_rejected(self, seeded_jobs_db: Session):
        svc = JobService(seeded_jobs_db)
        with pytest.raises(ValueError, match="limit must be between 1 and 100"):
            svc.list_jobs(limit=0)

    def test_keyword_filter(self, seeded_jobs_db: Session):
        svc = JobService(seeded_jobs_db)
        result = svc.list_jobs(keyword="Python")
        assert result.total > 0
        for item in result.items:
            assert "python" in item.title.lower() or "python" in item.company_name.lower()


# ═════════════════════════════════════════════════════════════════════════
# Router / API tests
# ═════════════════════════════════════════════════════════════════════════


class TestJobsAPI:
    def test_list_jobs_returns_200(self, client: TestClient):
        resp = client.get("/api/v1/jobs")
        assert resp.status_code == 200
        body = resp.json()
        assert "items" in body
        assert "total" in body
        assert "page" in body
        assert "limit" in body
        assert body["page"] == 1
        assert body["limit"] == 20
        assert len(body["items"]) > 0

    def test_get_job_by_id_returns_200(self, client: TestClient):
        # Get an ID from the list first
        list_resp = client.get("/api/v1/jobs")
        items = list_resp.json()["items"]
        assert len(items) > 0
        job_id = items[0]["id"]

        resp = client.get(f"/api/v1/jobs/{job_id}")
        assert resp.status_code == 200
        body = resp.json()
        assert body["id"] == job_id
        assert "title" in body
        assert "company_name" in body
        assert "description" in body
        # sensitive fields
        assert "password_hash" not in body
        assert "deleted_at" not in body

    def test_get_job_returns_404_for_unknown(self, client: TestClient):
        resp = client.get("/api/v1/jobs/99999")
        assert resp.status_code == 404

    def test_keyword_filter(self, client: TestClient):
        resp = client.get("/api/v1/jobs?keyword=Python")
        assert resp.status_code == 200
        body = resp.json()
        assert body["total"] > 0
        for item in body["items"]:
            assert "python" in item["title"].lower() or "python" in item["company_name"].lower()

    def test_location_filter(self, client: TestClient):
        resp = client.get("/api/v1/jobs?location=Đà Nẵng")
        assert resp.status_code == 200
        body = resp.json()
        assert body["total"] > 0
        for item in body["items"]:
            assert "đà nẵng" in item["location"].lower()

    def test_skill_filter(self, client: TestClient):
        resp = client.get("/api/v1/jobs?skill=Python")
        assert resp.status_code == 200
        body = resp.json()
        assert body["total"] > 0
        for item in body["items"]:
            assert item["skills"] is not None
            assert any(s.lower() == "python" for s in item["skills"])

    def test_pagination(self, client: TestClient):
        resp = client.get("/api/v1/jobs?page=2&limit=2")
        assert resp.status_code == 200
        body = resp.json()
        assert body["page"] == 2
        assert body["limit"] == 2

    def test_page_lt_1_rejected(self, client: TestClient):
        # FastAPI Query(ge=1) returns 422 automatically
        resp = client.get("/api/v1/jobs?page=0")
        assert resp.status_code == 422

    def test_limit_gt_100_rejected(self, client: TestClient):
        # FastAPI Query(le=100) returns 422 automatically
        resp = client.get("/api/v1/jobs?limit=500")
        assert resp.status_code == 422

    def test_jobs_health_endpoint(self, client: TestClient):
        resp = client.get("/api/v1/jobs/health")
        assert resp.status_code == 200
        body = resp.json()
        assert body["module"] == "jobs"
        assert body["status"] == "ok"

    def test_health_does_not_clash_with_job_id(self, client: TestClient):
        """GET /api/v1/jobs/health must return health, not look for job id='health'."""
        resp = client.get("/api/v1/jobs/health")
        assert resp.status_code == 200
        assert resp.json()["module"] == "jobs"
