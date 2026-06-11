# PROJECT_MEMORY.md

Cross-session project memory for Web-AI / ViecConnect IT Jobs.

## Project Origin

This project is the redesigned and improved version of PB1 and PB2. It combines lessons learned from both predecessors into a single, well-architected platform.

## Completed Epics

| Epic | Name                         | Completed   | Notes                                            |
|------|------------------------------|-------------|--------------------------------------------------|
| 0.1  | Skeleton Repository          | 2026-06-09  | Repo structure, documentation foundation         |
| 0.2  | Documentation Optimization   | 2026-06-09  | Architecture freeze v1.1, dedup, ADRs            |
| 0.3  | Backend Foundation           | 2026-06-09  | FastAPI scaffold, DB foundation, config          |
| 0.4  | Frontend Foundation          | 2026-06-09  | React+Vite+Tailwind for user-web & admin-web     |
| 1.1  | Identity Domain Foundation   | 2026-06-09  | BaseEntity, User model, schemas, repo, service   |
| 1.2  | DB, Hashing & JWT Foundation | 2026-06-10  | Alembic, users migration, passlib+bcrypt, PyJWT  |
| 1.3  | Authentication API           | 2026-06-10  | Register, login, refresh, /me, auth dependency   |
| 1.4  | Auth UI                      | 2026-06-10  | Login page, register, AuthProvider, ProtectedRoute|
| 1.6  | User Web Auth UI Polish (v4)  | 2026-06-10  | #1E5FD4 palette, hero cards, OAuth btns, 40/60 layout |
| 2.1  | Job Model/Schema             | 2026-06-10  | Job model (JSONB skills), schemas, migration, tests    |
| 2.2  | CSV + Mock Job Sources       | 2026-06-10  | BaseJobSource ABC, MockSource (18 jobs), CSVSource (20) |
| 2.3  | Job Import Pipeline          | 2026-06-10  | 8-stage pipeline, ImportSummary, dry_run, skill extractor |
| 2.4  | Read-Only Jobs API           | 2026-06-10  | GET /jobs, GET /jobs/{id}, filters, pagination, 103 tests  |
| 2.5  | CareerLink Detail Parser     | 2026-06-10  | JSON-LD extraction, listing parser, CareerLinkSource, 122 tests |
| 2.6  | Crawl4AI Infrastructure      | 2026-06-10  | Crawl4AIClient, RawPage, async+sync API, 141 tests              |
| 2.7  | User Jobs UI                 | 2026-06-10  | JobsPage, JobDetailPage, search/filter, cards, footer, build ok |
| 2.8  | Listing Parser + Sync        | 2026-06-11  | crawler_tasks, scheduler, sync script, 10 real CareerLink jobs, 154 tests |

## Known Issues

- FastAPI returns 422 (not 401) for missing `Authorization` header — framework-level `Header(...)` validation fires before handler code.
- Pydantic `field_validator` validation errors surface as 422, not 400 — `_ERROR_MAP` entries for schema-level checks are dead code.
- Dev `SECRET_KEY` is 24 bytes — PyJWT warns this is below the 32-byte minimum for HS256. Not a runtime issue; production key will resolve.

## Accepted Tradeoffs

- Stateless JWT — no refresh_tokens table, no blacklist, no revocation. Accepted for MVP.
- bcrypt <4.1 pinned for passlib 1.7.4 compatibility.

## Lessons Learned

### From PB1 and PB2

1. **Start with frozen architecture** — avoids drift during implementation.
2. **Documentation-first** — cheaper to change docs than code.
3. **Separate Admin from User Web** — different concerns from day one.
4. **Validation pipeline before DB** — dirty data causes cascading problems.
5. **AI Gateway centralization** — avoids scattered API keys and usage tracking.

### From Epic 0

1. **Single source of truth for rules** — AGENT_CONTEXT.md is canonical.
2. **Phase files keep main docs lean** — per-epic details in docs/phases/.
3. **ADR format is lightweight and effective** — decisions with rationale.

### From Epic 1.1

1. **Integer PK over UUID** — simpler, smaller indexes, human-readable.
2. **BaseEntity as a mixin, not a table** — reusable across all future modules (Jobs, CV, Interview, ChatHistory, AdminLog).
3. **Soft delete from day one** — `deleted_at` + `is_active` pattern; no hard deletes.
4. **Flat module structure** — one file per concern (model.py, schema.py, repository.py, service.py).

### From Epic 1.2

1. **pin bcrypt <4.1 for passlib compat** — passlib 1.7.4 does not work with bcrypt ≥5.0.
2. **PyJWT over python-jose** — lighter dependency, same functionality for HS256.
3. **Security utilities ready** — password hashing, JWT creation/validation, token type enforcement all verified at runtime.

### From Epic 1.3

1. **ValueError → HTTPException mapping** — the router layer converts service-level ValueErrors to proper HTTP status codes (400/401).
2. **Refresh tokens must not be used as access tokens** — `get_current_user` checks `type == "access"`.
3. **Stateless JWT for MVP** — no refresh_tokens table, no blacklist, no revocation; accepted tradeoff.
4. **EmailStr via email-validator** — Pydantic v2 EmailStr requires the optional `email-validator` package.

### From Epic 1.3 Runtime Setup

1. **Local PostgreSQL uses peer/trust auth** — `DATABASE_URL=postgresql://<local_user>@localhost/<db>` with no password on macOS Homebrew.
2. **FastAPI Header(...) validation produces 422** — missing required headers raise Pydantic `ValidationError` before handler code executes.
3. **Pydantic field_validator also produces 422** — schema-level validation errors bypass the router's `_ERROR_MAP`.

### From Epic 1.4

1. **React Context over Redux/Zustand for auth** — keeps MVP dependencies minimal. One provider, one hook.
2. **localStorage for tokens** — accepted MVP tradeoff; HttpOnly cookies require backend changes.
3. **No automatic token refresh** — deferred to future phase. Expired token shows Vietnamese message and redirects.
4. **Frontend-only logout** — no backend logout endpoint exists. Refresh token remains valid until expiration.

### From Epic 1.6 (v4)

1. **40/60 split layout** — form section (40%, #F8F9FB background) + hero section (60%, white) with shared global header (64px).
2. **Design token palette** — #1E5FD4 primary, #1A4BA8 hover, brand color set (blue/green/purple/orange + light variants), #EBEBEB borders.
3. **OAuth buttons as visual placeholder** — Google + LinkedIn buttons rendered but disabled; real OAuth deferred.
4. **SVG inline icons vs library** — envelope, lock, eye, user, briefcase, bell, chart, shield all hand-coded as inline SVG to avoid icon library dependency.
5. **Show/hide password toggle** — eye-on/eye-off SVG toggle per password field, each tracked independently.

### From Phase 2.1

1. **JSONB for skills** — PostgreSQL native JSONB over Text; enables indexing and querying individual skills without parsing.
2. **Job model inherits BaseEntity** — reuses id, created_at, updated_at, deleted_at. No separate company table for MVP.
3. **JobListItem is lightweight** — omits description/requirements/benefits for list views; reduces payload size.
4. **Python-side timestamps** — consistent with BaseEntity pattern (`default=datetime.utcnow`, not `server_default=func.now()`).

### From Phase 2.2

1. **Pluggable source contract** — `BaseJobSource` ABC with `fetch_jobs() → list[JobCreate]`. Future sources (CareerLink, TopCV) follow the same interface.
2. **Case-insensitive skill dedup** — `"React;react"` → `["React"]`. Keeps first casing, case-insensitive key comparison. Critical for matching pipeline.
3. **CSV validation at row level** — every row validated through `JobCreate` before return. Duplicate detection on (title, company, location).
4. **Data/sample is source of truth for test data** — CSV path convention uses `Path(__file__).resolve().parents[4]` from test files.

### From Phase 2.3

1. **Pipeline is the single write path** — sources and crawlers MUST NOT write to DB. All writes go through `import_pipeline.py`.
2. **One failure ≠ batch failure** — each job is persisted individually; a single bad row does not crash the entire import.
3. **Quality score is a separate concern** — `JobCreate` has no `quality_score` field. Calculated during persistence and passed to `repository.create()` as a keyword argument.
4. **Fake repository for unit tests** — `tests/fakes.py` provides an in-memory `FakeJobRepository` that follows the same interface as `JobRepository`, enabling pipeline tests without a real database.

### From Phase 2.3 Fixes

1. **Dry run now computes quality scores** — `dry_run=True` runs the complete pipeline including quality score calculation; only `repository.create()` is skipped.
2. **Skill extraction preserves first-appearance order** — skills are ordered by their position in the source text, not alphabetically.
3. **Batch insert TODO** — noted in `import_pipeline.py` and README for Phase 4+ performance optimization.

### From Phase 2.4

1. **Read-only API first** — listing and detail endpoints built before any write/admin routes. Simpler to verify, simpler to test.
2. **JSONB skill filter via raw text()** — `jsonb_array_elements_text()` wrapped in `text().bindparams()`; SQLAlchemy's `func` construct couldn't compose the `lower()` call correctly with PostgreSQL's set-returning function.
3. **FastAPI Query ge/le for pagination validation** — 422 returned automatically by FastAPI when `page=0` or `limit=500`; no manual error mapping needed.
4. **TestClient with dependency_overrides** — `seeded_jobs_db` fixture seeds via import pipeline, then the override injects the seeded session into the FastAPI dependency graph.

### From Phase 2.5

1. **JSON-LD JobPosting is the primary data source** — CareerLink embeds structured data via `<script type="application/ld+json">` blocks. This is far more reliable than CSS selectors for extracting title, company, location, salary, deadline, and logo.
2. **Benefits live outside JSON-LD** — CareerLink renders `job-benefit-item` divs in the HTML that are NOT included in the JSON-LD description. Must scrape both.
3. **Description/Requirements split via marker** — CareerLink consistently uses `* Kinh nghiệm / Kỹ năng chi tiết:` as a separator within the JSON-LD description field. Splitting on this yields clean description and requirements sections.
4. **Listing pages use `<a class="job-link">`** — 50 jobs per page with `href="/tim-viec-lam/<slug>/<id>?source=site"`. Strip `?source=site` to get canonical URLs.
5. **One failed page doesn't crash the source** — `CareerLinkSource.fetch_jobs()` catches ValueError per page, logs, and continues. Returns whatever valid `JobCreate` payloads were parsed.
6. **Source must never import repository/service** — `CareerLinkSource` only depends on `parsers` and `schema`. DB access is exclusively the pipeline's responsibility.
7. **Real HTML fixtures are mandatory** — 4 fixtures (sample_listing, sample_detail, missing_title, malformed_detail) captured from live CareerLink pages. Tests verify against real markup structure, not fabricated HTML.

### From Phase 2.6

1. **RawPage is the stable contract** — a Pydantic BaseModel insulating all consumers from Crawl4AI internals. Future parsers never import crawl4ai; they consume `RawPage.html`, `RawPage.markdown`, etc.
2. **Both async + sync APIs required** — `fetch_page()` for async callers, `fetch_page_sync()` for synchronous callers (e.g. `BaseJobSource.fetch_jobs()`). The sync wrapper detects running event loops and spawns a thread-pool executor when needed.
3. **Crawl4AI must never leak** — `from crawl4ai` imports are confined to `crawl4ai_client.py`. All other modules import only `RawPage` and `Crawl4AIClient` from `app.infrastructure.external`.
4. **Error handling at the boundary** — all Crawl4AI exceptions (DNS, timeout, blocked) are caught inside `fetch_page()` and returned as `RawPage(success=False, error="...")`. No exception escapes the client.
5. **Client is source-agnostic** — no CareerLink, ITviec, or job-specific logic. Crawl4AIClient is usable by AI Interview, CV Matching, Chatbot, and any future module.
6. **AI-ready content preservation** — `RawPage.markdown` and `RawPage.text` carry Crawl4AI's clean output without summarization or truncation. Future AI modules decide how to use it.
7. **Mock at boundary for tests** — tests monkeypatch `crawl4ai.AsyncWebCrawler` (the external dependency), not `RawPage` (our contract). This validates the wrapper without depending on Crawl4AI internals.

### From Phase 2.7

1. **API-first frontend** — all job data comes from backend. Zero hardcoded jobs, fake companies, or mock data. `getJobs()` and `getJobById()` map directly to `GET /api/v1/jobs` and `GET /api/v1/jobs/{id}`.
2. **Design language follows reference images** — blue gradient hero, white rounded cards with soft shadows, horizontal job cards with company logo, colored skill tags, dark navy 5-column footer with newsletter banner.
3. **Branding: WEB-AI AI CAREER PLATFORM** — logo in header + footer, consistent across all pages. Old "ViecConnect IT Jobs" header replaced.
4. **Loading / empty / error states are mandatory** — skeleton cards for loading, "Không tìm thấy việc làm phù hợp" for empty, specific error messages, 404 for missing jobs. Never blank screens.
5. **No state management library** — useEffect + useState is sufficient for jobs list + detail. No Redux, Zustand, or MobX needed.
6. **Horizontal cards, not vertical** — job cards are left-right (logo | title+company+location+salary+skills) per reference images. Single column mobile, two tablet, three desktop.
7. **Top Companies section conditional** — groups jobs by company_name from a separate API call (limit=100), sorts by count desc, renders only if ≥4 unique companies. Pure data-driven — hides if not enough data.
8. **Placeholder buttons for future features** — "Phân tích CV" and "Ứng tuyển" are rendered but disabled. Ready for Phase 2.8+ integration.
9. **Strict TypeScript throughout** — no `any`, no `unknown` in interfaces. Types mirror backend Pydantic schemas exactly.
10. **Footer is professionally complete** — 5 columns (brand, candidates, employers, about, contact), social icons, SSL badge, copyright. All placeholder links ready for future pages.

---

*Update this file with important context, discoveries, and lessons as the project evolves.*
