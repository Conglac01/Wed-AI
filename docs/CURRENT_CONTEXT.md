# CURRENT_CONTEXT.md

## Project

**Web-AI** — ViecConnect IT Jobs | ViecConnect Admin

## Current Epic

**Epic 2** — Jobs Platform

## Current Phase

**Phase 2.8** — Listing Parser + Sync

## Status

**Implemented** — Runtime Verified (2026-06-11)

## Recent Changes

- `app/modules/jobs/crawler_tasks.py` — `run_careerlink_crawl()` bridges CareerLinkSource → JobImportPipeline → Repository
- `app/modules/jobs/scheduler.py` — lightweight background scheduler (disabled by default, no Celery)
- `app/modules/jobs/lifecycle.py` — `start_jobs_lifecycle()` / `stop_jobs_lifecycle()` startup/shutdown hooks
- `scripts/sync_careerlink.py` — manual CLI sync: `python scripts/sync_careerlink.py --limit 10`
- `app/core/config.py` — added config keys: `JOBS_SCHEDULER_ENABLED`, `JOBS_SYNC_INTERVAL_HOURS`, `JOBS_SYNC_MAX_JOBS`, `JOBS_SYNC_TIMEOUT_SECONDS`, `CRAWLER_REQUEST_DELAY_SECONDS`
- `app/modules/jobs/repository.py` — fixed `jsonb_array_elements_text` crash on scalar JSONB skills (guard with `jsonb_typeof(skills) = 'array'`)
- `CrawlSummary` dataclass — `source`, `fetched`, `imported`, `skipped`, `failed`, `errors`
- 13 new tests (test_crawler.py) covering: CrawlSummary, successful import, dedup, source failure, pipeline failure, scheduler disabled by default, scheduler start/stop safety, lifecycle idempotency, DB isolation
- 154 total tests, 0 failures
- Live verified: SYNC #1 (5 fetched → 5 imported), SYNC #2 (5 fetched → 0 imported, 5 skipped — dedup working)
- DB now has 28 jobs: 18 Mock + 10 CareerLink (5 with source_name=None, 5 with source_name="CareerLink")

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/jobs | Paginated list with ?keyword, ?location, ?skill, ?page, ?limit |
| GET | /api/v1/jobs/{job_id} | Single job detail (active + non-deleted only) |
| GET | /api/v1/jobs/health | Module health check |

## Known Issues

- No write endpoints (by design — read-only Phase 2.4)
- No admin endpoints yet (Phase 2.5+)
- SQLAlchemy `datetime.utcnow()` deprecation (BaseEntity — consistent across project)

## Blockers

None.

## Next Phase

**Phase 2.9** — Admin Dashboard / Jobs Management

## Commands

```bash
# Backend
cd apps/backend
source .venv/bin/activate
.venv/bin/python -m pytest app/modules/jobs/tests/ -v   # 103 tests
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
