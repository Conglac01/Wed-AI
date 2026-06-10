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

---

*Update this file with important context, discoveries, and lessons as the project evolves.*
