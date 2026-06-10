# CURRENT_CONTEXT.md

## Project

**Web-AI** — ViecConnect IT Jobs | ViecConnect Admin

## Current Epic

**Epic 2** — Jobs Platform

## Current Phase

**Phase 2.3** — Job Import Pipeline

## Status

**Implemented** — Ready for Review

## Recent Changes

- Import pipeline: `validate → clean → deduplicate → normalize → extract skills → quality score → persist`
- 8 pipeline stages: `validation.py`, `cleaning.py`, `deduplication.py`, `normalization.py`, `skill_extractor.py`, `quality_score.py`, `import_pipeline.py` (orchestrator)
- `ImportSummary` Pydantic model — JSON-serializable import report
- `JobRepository` extended: `create()` (with quality_score), `exists_active_duplicate()`
- `JobService` extended: `create_job()`
- `dry_run=True` mode — runs full pipeline without database writes
- Skill extractor: 33 canonical IT skills, case-insensitive matching, canonical names returned
- Quality score: deterministic 0.0–1.0 across 9 criteria
- Duplicate detection: in-batch (first wins) + DB-aware (is_active=True, deleted_at IS NULL)
- Transaction safety: one bad job does not crash the batch
- FAKE repository (`tests/fakes.py`) for pipeline unit tests
- 74/74 tests passing (36 existing + 38 new pipeline tests)

## Known Issues

- No CRUD endpoints yet (coming in Phase 2.4)
- Skill extractor uses hardcoded dictionary — no AI/ML
- Quality score is deterministic but simplistic — future phases may add AI

## Blockers

None.

## Next Phase

**Phase 2.4** — Job CRUD & Search API

## Commands

```bash
# Backend
cd apps/backend
source .venv/bin/activate
.venv/bin/python -m pytest app/modules/jobs/tests/ -v   # 74 tests
uvicorn app.main:app --reload

# User Web
cd apps/user-web
npm install
npm run dev

# Admin Web
cd apps/admin-web
npm install
npm run dev -- --port 5174
```
