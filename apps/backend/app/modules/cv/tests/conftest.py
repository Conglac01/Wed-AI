"""Shared fixtures for CV module integration tests (real DB)."""

import pytest
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.modules.cv.model import CV
from app.modules.cv.schema import CVCreate
from app.modules.cv.service import CVService


@pytest.fixture(scope="function")
def db_session() -> Session:
    """Provide a clean database session, rolled back after each test."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


@pytest.fixture(scope="function")
def test_user_id(db_session: Session) -> int:
    """Return the ID of a real user to use in CV ownership tests."""
    # Identity seeding creates test users — pick the first one.
    from app.modules.identity.model import User

    user = db_session.query(User).first()
    if user is None:
        # No user exists — create a minimal one for tests
        from app.modules.identity.repository import UserRepository
        from app.modules.identity.schema import UserCreateInternal

        repo = UserRepository(db_session)
        user = repo.create(
            UserCreateInternal(
                email="cv_test_user@example.com",
                password_hash="test_hash_placeholder",
            )
        )

    return user.id


@pytest.fixture(scope="function")
def cv_service(db_session: Session) -> CVService:
    """Return a CVService wired to the test DB session."""
    return CVService(db_session)


@pytest.fixture(scope="function")
def seeded_cv(cv_service: CVService, test_user_id: int):
    """Create one CV for the test user, return the CVResponse."""
    return cv_service.create_cv_record(
        test_user_id,
        CVCreate(original_file_path="uploads/cv/test_cv.pdf"),
    )
