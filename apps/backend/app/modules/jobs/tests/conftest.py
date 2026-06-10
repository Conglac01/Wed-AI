"""Shared fixtures for jobs module integration tests (real DB)."""

import pytest
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.modules.jobs.model import Job
from app.modules.jobs.sources.mock_source import MockJobSource
from app.modules.jobs.pipeline.import_pipeline import JobImportPipeline


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
def seeded_jobs_db(db_session: Session) -> Session:
    """Seed the database with MockJobSource jobs, return the session.

    Existing duplicate rows are skipped (import pipeline dedup logic).
    """
    # Clean up any previously-inserted mock jobs so each test starts fresh.
    _delete_mock_jobs(db_session)

    # Run the import pipeline.
    source = MockJobSource()
    pipeline = JobImportPipeline(db_session)
    summary = pipeline.run(source, dry_run=False)

    assert summary.inserted_count > 0, f"Expected jobs to be seeded, got {summary.inserted_count}"
    return db_session


def _delete_mock_jobs(session: Session) -> None:
    """Remove jobs that were inserted by the Mock source in a previous test."""
    session.query(Job).filter(Job.source_name == "Mock").delete()
    session.commit()
