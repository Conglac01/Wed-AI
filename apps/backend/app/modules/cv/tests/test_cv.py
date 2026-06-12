"""Integration tests for CV — repository, service, router."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import create_access_token
from app.db.session import get_db
from app.main import app
from app.modules.cv.model import CV
from app.modules.cv.repository import CVRepository
from app.modules.cv.schema import CVCreate, CVListResponse, CVResponse, CVUpdate
from app.modules.cv.service import CVService


# ═════════════════════════════════════════════════════════════════════════
# TestClient helper
# ═════════════════════════════════════════════════════════════════════════


def _auth_headers(user_id: int) -> dict[str, str]:
    """Build an Authorization header for the given user_id."""
    token = create_access_token(subject=user_id)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def client(db_session: Session, test_user_id: int):
    """FastAPI TestClient using the test DB session."""

    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


# ═════════════════════════════════════════════════════════════════════════
# Repository tests
# ═════════════════════════════════════════════════════════════════════════


class TestCVRepository:
    def test_create_cv(self, db_session: Session, test_user_id: int):
        repo = CVRepository(db_session)
        cv = repo.create(CVCreate(), user_id=test_user_id)
        assert cv.id is not None
        assert cv.user_id == test_user_id
        assert cv.deleted_at is None

    def test_get_by_id_returns_non_deleted(self, db_session: Session, test_user_id: int):
        repo = CVRepository(db_session)
        cv = repo.create(CVCreate(), user_id=test_user_id)
        assert repo.get_by_id(cv.id) is not None

    def test_get_by_id_ignores_deleted(self, db_session: Session, test_user_id: int):
        repo = CVRepository(db_session)
        cv = repo.create(CVCreate(), user_id=test_user_id)
        repo.soft_delete(cv.id)
        assert repo.get_by_id(cv.id) is None

    def test_list_by_user_returns_owned_cvs(self, db_session: Session, test_user_id: int):
        repo = CVRepository(db_session)
        repo.create(CVCreate(), user_id=test_user_id)
        repo.create(CVCreate(), user_id=test_user_id)
        rows, total = repo.list_by_user(test_user_id)
        assert len(rows) >= 2
        assert total >= 2

    def test_list_by_user_excludes_others(self, db_session: Session, test_user_id: int):
        repo = CVRepository(db_session)
        repo.create(CVCreate(), user_id=test_user_id)
        # Other user's CV should not appear
        other_id = test_user_id + 9999
        rows, _ = repo.list_by_user(other_id)
        assert len(rows) == 0

    def test_update_cv(self, db_session: Session, test_user_id: int):
        repo = CVRepository(db_session)
        cv = repo.create(CVCreate(), user_id=test_user_id)
        updated = repo.update(cv.id, CVUpdate(quality_score=85.5))
        assert updated.quality_score == 85.5

    def test_soft_delete(self, db_session: Session, test_user_id: int):
        repo = CVRepository(db_session)
        cv = repo.create(CVCreate(), user_id=test_user_id)
        deleted = repo.soft_delete(cv.id)
        assert deleted.deleted_at is not None
        assert repo.get_by_id(cv.id) is None


# ═════════════════════════════════════════════════════════════════════════
# Service tests
# ═════════════════════════════════════════════════════════════════════════


class TestCVService:
    def test_create_and_get(self, cv_service: CVService, test_user_id: int):
        resp = cv_service.create_cv_record(test_user_id, CVCreate())
        assert isinstance(resp, CVResponse)
        assert resp.user_id == test_user_id

        # Get by owner
        fetched = cv_service.get_cv(resp.id, user_id=test_user_id)
        assert fetched is not None
        assert fetched.id == resp.id

    def test_get_returns_none_for_other_user(self, cv_service: CVService, test_user_id: int, seeded_cv: CVResponse):
        # Another user should not be able to access this CV
        other_id = test_user_id + 9999
        assert cv_service.get_cv(seeded_cv.id, user_id=other_id) is None

    def test_list_user_cvs(self, cv_service: CVService, test_user_id: int):
        cv_service.create_cv_record(test_user_id, CVCreate())
        cv_service.create_cv_record(test_user_id, CVCreate())
        result = cv_service.list_user_cvs(test_user_id)
        assert isinstance(result, CVListResponse)
        assert len(result.items) >= 2
        assert result.total >= 2

    def test_update_cv(self, cv_service: CVService, test_user_id: int, seeded_cv: CVResponse):
        updated = cv_service.update_cv_record(
            seeded_cv.id, test_user_id, CVUpdate(quality_score=92.0)
        )
        assert updated.quality_score == 92.0

    def test_update_ownership_guard(self, cv_service: CVService, test_user_id: int, seeded_cv: CVResponse):
        other_id = test_user_id + 9999
        with pytest.raises(ValueError, match="CV not found"):
            cv_service.update_cv_record(seeded_cv.id, other_id, CVUpdate(quality_score=99.0))

    def test_delete_cv(self, cv_service: CVService, test_user_id: int):
        resp = cv_service.create_cv_record(test_user_id, CVCreate())
        cv_service.delete_cv_record(resp.id, test_user_id)
        assert cv_service.get_cv(resp.id, user_id=test_user_id) is None

    def test_delete_ownership_guard(self, cv_service: CVService, test_user_id: int, seeded_cv: CVResponse):
        other_id = test_user_id + 9999
        with pytest.raises(ValueError, match="CV not found"):
            cv_service.delete_cv_record(seeded_cv.id, other_id)


# ═════════════════════════════════════════════════════════════════════════
# Router / API tests
# ═════════════════════════════════════════════════════════════════════════


class TestCVAPI:
    def test_create_cv_returns_201(self, client: TestClient, test_user_id: int):
        resp = client.post(
            "/api/v1/cv",
            json={},
            headers=_auth_headers(test_user_id),
        )
        assert resp.status_code == 201
        body = resp.json()
        assert body["user_id"] == test_user_id
        assert "id" in body

    def test_create_unauthenticated_rejected(self, client: TestClient):
        resp = client.post("/api/v1/cv", json={})
        assert resp.status_code in (401, 422)  # 422 if missing header entirely

    def test_list_cvs_returns_200(self, client: TestClient, test_user_id: int):
        # Seed two CVs
        headers = _auth_headers(test_user_id)
        client.post("/api/v1/cv", json={}, headers=headers)
        client.post("/api/v1/cv", json={}, headers=headers)

        resp = client.get("/api/v1/cv", headers=headers)
        assert resp.status_code == 200
        body = resp.json()
        assert body["total"] >= 2
        assert "items" in body

    def test_get_cv_returns_200(self, client: TestClient, test_user_id: int):
        headers = _auth_headers(test_user_id)
        create_resp = client.post("/api/v1/cv", json={}, headers=headers)
        cv_id = create_resp.json()["id"]

        resp = client.get(f"/api/v1/cv/{cv_id}", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["id"] == cv_id

    def test_get_cv_other_user_returns_404(self, client: TestClient, test_user_id: int):
        headers = _auth_headers(test_user_id)
        create_resp = client.post("/api/v1/cv", json={}, headers=headers)
        cv_id = create_resp.json()["id"]

        # Another user (different ID) tries to access
        other_headers = _auth_headers(test_user_id + 99999)
        resp = client.get(f"/api/v1/cv/{cv_id}", headers=other_headers)
        # User doesn't exist → 401, or user exists but doesn't own it → 404
        # Both are correct rejection behaviors
        assert resp.status_code in (401, 404)

    def test_get_cv_not_found_returns_404(self, client: TestClient, test_user_id: int):
        resp = client.get("/api/v1/cv/99999", headers=_auth_headers(test_user_id))
        assert resp.status_code == 404

    def test_update_cv_returns_200(self, client: TestClient, test_user_id: int):
        headers = _auth_headers(test_user_id)
        create_resp = client.post("/api/v1/cv", json={}, headers=headers)
        cv_id = create_resp.json()["id"]

        resp = client.patch(
            f"/api/v1/cv/{cv_id}",
            json={"quality_score": 95.0},
            headers=headers,
        )
        assert resp.status_code == 200
        assert resp.json()["quality_score"] == 95.0

    def test_delete_cv_returns_204(self, client: TestClient, test_user_id: int):
        headers = _auth_headers(test_user_id)
        create_resp = client.post("/api/v1/cv", json={}, headers=headers)
        cv_id = create_resp.json()["id"]

        resp = client.delete(f"/api/v1/cv/{cv_id}", headers=headers)
        assert resp.status_code == 204

        # Verify gone
        get_resp = client.get(f"/api/v1/cv/{cv_id}", headers=headers)
        assert get_resp.status_code == 404
