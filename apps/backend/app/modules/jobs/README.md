# Jobs Module

## Purpose

Job listing, search, filtering, detail views, data pipeline, and import for ViecConnect IT Jobs.

## Responsibilities

* Job model (SQLAlchemy, JSONB skills)
* Job schemas (Pydantic v2)
* Repository & Service layers
* Pluggable job sources (Mock, CSV, future: CareerLink, TopCV, etc.)
* Import pipeline (validate → clean → deduplicate → normalize → extract skills → score → persist)
* Sample data for testing & development

## Module Files

| File                         | Purpose                                              |
|------------------------------|------------------------------------------------------|
| `model.py`                   | `Job` SQLAlchemy model (table `jobs`)                |
| `schema.py`                  | Pydantic request/response schemas                    |
| `repository.py`              | Data access layer (create, get_by_id, dup check)     |
| `service.py`                 | Business logic (create_job)                          |
| `router.py`                  | API endpoints (health only)                          |
| `sources/base.py`            | `BaseJobSource` abstract contract                    |
| `sources/mock_source.py`     | `MockJobSource` — 18 realistic IT jobs               |
| `sources/csv_source.py`      | `CSVJobSource` — load from semicolon CSV             |
| `pipeline/validation.py`     | Validate required fields, salary ranges              |
| `pipeline/cleaning.py`       | Trim whitespace, collapse spaces, blank→None         |
| `pipeline/deduplication.py`  | In-batch + DB-aware duplicate detection              |
| `pipeline/normalization.py`  | Skill dedup/casing, location cleanup                 |
| `pipeline/skill_extractor.py`| Normalize existing skills or extract from text       |
| `pipeline/quality_score.py`  | Deterministic 0.0–1.0 completeness score             |
| `pipeline/import_pipeline.py`| Orchestrator: source → validate… → persist → summary |
| `tests/`                     | 74 tests (schema + sources + pipeline)               |

## Import Pipeline

```
source → validate → clean → deduplicate → normalize → extract skills → quality score → persist
```

### Pipeline Stages

| Stage | File | Responsibility |
|-------|------|---------------|
| Validate | `validation.py` | Rejects missing required fields, invalid salary ranges |
| Clean | `cleaning.py` | Trim, collapse spaces, blank→None. Preserves Vietnamese. |
| Deduplicate | `deduplication.py` | In-batch (first wins) + DB check (is_active, deleted_at IS NULL) |
| Normalize | `normalization.py` | Skill dedup (case-insensitive, first casing), location cleanup |
| Extract skills | `skill_extractor.py` | Normalize existing skills; if missing, extract from title/desc/reqs |
| Quality score | `quality_score.py` | 0.0–1.0 based on 9 criteria (title, skills, salary, desc length, etc.) |
| Persist | `import_pipeline.py` | Creates Job rows via repository; one failure != batch failure |

### Dry Run Mode

`dry_run=True`: runs all stages EXCEPT database persistence. Returns `ImportSummary`.

### ImportSummary

Pydantic model with: `source_name`, `fetched_count`, `validated_count`, `cleaned_count`,
`normalized_count`, `inserted_count`, `skipped_duplicate_count`, `failed_count`,
`errors` (list[str]), `dry_run` (bool).

### Duplicate Detection Rules

* **In-batch:** (title, company_name, location) — case-insensitive, first occurrence preserved
* **Database:** checks `is_active=True AND deleted_at IS NULL` via `exists_active_duplicate()`
* Duplicates are **skipped and reported** — never block the import

### Quality Score Rules

* Deterministic, clamped 0.0–1.0
* 9 criteria: title, company, location, meaningful description, skills, salary, requirements, benefits, source_url
* `JobCreate` does NOT contain `quality_score` — it is set at persistence time

### Skill Extraction Rules

* Case-insensitive matching against a hardcoded IT skill dictionary (33 canonical names)
* Returns canonical casing (e.g., "nodejs" → "Node.js", "aws" → "AWS")
* **First-appearance order preserved** (skills ordered by position in source text)
* Deduplicated (each canonical name appears once)
* No AI calls, no external dependencies

### Persistence Rules

* Sources and crawlers MUST NEVER write to the database directly
* All writes go through `import_pipeline.py`
* `repository.create()` is the single persistence entry point
* Each job committed individually (one failure ≠ batch failure)
* **TODO (Phase 4+):** Consider batch insert for large imports (1000+ jobs) to reduce transaction overhead

## Data Sources

### Mock Source

Returns 18 realistic Vietnamese IT jobs across 9 categories.

### CSV Source

Loads from `data/sample/jobs_sample.csv`. Semicolon-separated skills.

## Architecture Notes

* Inherits `BaseEntity` for id, created_at, updated_at, deleted_at.
* `skills` field uses PostgreSQL JSONB for structured storage.
* Integer Primary Key used (consistent with project standard).
* Soft delete via `deleted_at` column.

## Module Status

Import Pipeline Complete

Owner Epic:

Epic 2 — Jobs Platform

Current Phase:

Phase 2.3 — Job Import Pipeline

Next Phase:

Phase 2.4 — Job CRUD & Search API
