# CURRENT_CONTEXT.md

## Project

**Web-AI** — ViecConnect IT Jobs | ViecConnect Admin

## Current Epic

**Epic 2** — Jobs Platform

## Current Phase

**Phase 2.2** — CSV + Mock Job Sources

## Status

**Implemented** — Ready for Review

## Recent Changes

- `BaseJobSource` ABC — pluggable contract for all future job sources
- `MockJobSource` — 18 realistic Vietnamese IT jobs (8 categories, 10 companies, 4 locations)
- `CSVJobSource` — loads & validates jobs from semicolon-delimited CSV with skill normalization
- `jobs_sample.csv` — 20 curated IT job listings (Vietnamese content, YYYY-MM-DD deadlines)
- Skill normalization: trim, dedent, deduplicate case-insensitively (keep first casing)
- Duplicate detection: (title, company_name, location) uniqueness enforced
- 36/36 tests passing (28 source tests + 8 schema tests)
- No database writes — all sources are read-only (return `list[JobCreate]`)

## Known Issues

- No CRUD endpoints yet (coming in Phase 2.3)
- No search/filter logic yet
- No frontend jobs UI yet
- CSV sample data is for development/testing only — not production

## Blockers

None.

## Next Phase

**Phase 2.3** — Job CRUD & Search API

## Commands

```bash
# Backend
cd apps/backend
source .venv/bin/activate
pytest app/modules/jobs/tests/ -v   # 36 tests
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
