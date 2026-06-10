# Jobs Module

## Purpose

Job listing, search, filtering, detail views, and data pipeline for ViecConnect IT Jobs.

## Responsibilities

* Job model (SQLAlchemy, JSONB skills)
* Job schemas (Pydantic v2)
* Repository & Service layers (skeleton)
* Pluggable job sources (Mock, CSV, future: CareerLink, TopCV, etc.)
* Sample data for testing & development

## Module Files

| File                     | Purpose                                       |
|--------------------------|-----------------------------------------------|
| `model.py`               | `Job` SQLAlchemy model (table `jobs`)         |
| `schema.py`              | Pydantic request/response schemas             |
| `repository.py`          | Data access layer                             |
| `service.py`             | Business logic (skeleton)                     |
| `router.py`              | API endpoints (health only)                   |
| `sources/base.py`        | `BaseJobSource` abstract contract             |
| `sources/mock_source.py` | `MockJobSource` — 18 realistic IT jobs        |
| `sources/csv_source.py`  | `CSVJobSource` — load from semicolon CSV      |
| `tests/`                 | 36 tests (schema + sources)                   |

## Data Sources

### Mock Source

Returns 18 realistic Vietnamese IT jobs across 8 categories:
Frontend, Backend, Fullstack, Data, AI, QA, DevOps, Mobile.

### CSV Source

Loads from `data/sample/jobs_sample.csv` (relative to backend root).

**CSV path convention:** Paths in `CSVJobSource` are relative to the backend project
root (`apps/backend/`). In tests, use absolute paths via `Path(__file__).resolve().parents[4]`.

**Skill normalization rules:**
* Split on `;`
* Trim whitespace, remove empty tokens
* Deduplicate case-insensitively, keeping casing of first occurrence
* E.g., `" React ; react ; TypeScript "` → `["React", "TypeScript"]`

**Duplicate detection:** Duplicate (title, company_name, location) inside a CSV raises `ValueError`.

### Sample Data

`data/sample/jobs_sample.csv` — 20 curated IT job listings with Vietnamese content.
Semicolon-separated skills, YYYY-MM-DD deadlines. For development and testing only.
**Not production data.**

## Architecture Notes

* Inherits `BaseEntity` for id, created_at, updated_at, deleted_at.
* `skills` field uses PostgreSQL JSONB for structured storage.
* Integer Primary Key used (consistent with project standard).
* Soft delete via `deleted_at` column.

## Module Status

Foundation + Data Sources

Owner Epic:

Epic 2 — Jobs Platform

Current Phase:

Phase 2.2 — CSV + Mock Job Sources

Next Phase:

Phase 2.3 — Job CRUD & Search API
