# AGENT_CONTEXT.md

Canonical rules and conventions for AI agents working on Web-AI / ViecConnect IT Jobs.

## Project Identity

- **Repository:** Web-AI
- **Product:** ViecConnect IT Jobs
- **Admin Product:** ViecConnect Admin

## Architecture Rules

1. Three deployable units: Backend (FastAPI), User Web (React), Admin Web (React).
2. Admin Web is a separate application from User Web — different roles, permissions, workflows.
3. Single backend serves both User Web and Admin Web.
4. No microservices before production scale (Epic 9).
5. All AI calls go through AI Gateway (DeepSeek).
6. Jobs data must pass validation pipeline before database insertion.
7. CareerLink crawler data must pass through the same pipeline.
8. Architecture is frozen at v1.1 — see [CANONICAL_ARCHITECTURE.md](CANONICAL_ARCHITECTURE.md).
9. Backend modules follow the standard pattern: `router.py`, `schema.py`, `model.py`, `repository.py`, `service.py`, `tests/`.

## AI Rules

1. Rule-based scoring before AI explanation — deterministic scores, AI adds qualitative value.
2. All AI calls route through centralized AI Gateway for control and monitoring.
3. No direct AI API calls from frontend — always through backend.

## Coding Rules

1. Backend: FastAPI (Python). Frontend: React + TypeScript + Vite + Tailwind.
2. Match the code style and conventions of existing code.
3. Prefer simple solutions — do not over-engineer.
4. Follow the standard module pattern for all new modules.
5. Use Vietnamese for user-facing content. Technical names remain English.

## Scope Rules

1. Do NOT implement features outside the current epic/phase.
2. Do NOT redesign architecture — it is frozen at v1.1.

## Never List

- Never skip the validation pipeline for job data.
- Never call AI APIs directly from the frontend.
- Never create microservices before Epic 9.
- Never mix Admin Web and User Web code.
- Never implement features from future epics.
- Never switch database to SQLite.
- Never hard-delete user records — use soft delete (`deleted_at` + `is_active`).
- Never expose `password_hash` or `deleted_at` in API responses.

## Always List

- Always read [CURRENT_CONTEXT.md](CURRENT_CONTEXT.md) before starting work.
- Always follow the phase plan in [PHASE_PLAN.md](PHASE_PLAN.md).
- Always record architectural decisions in [DECISIONS.md](DECISIONS.md).
- Always update [PROJECT_MEMORY.md](PROJECT_MEMORY.md) with cross-session context.
- Always consult [CANONICAL_ARCHITECTURE.md](CANONICAL_ARCHITECTURE.md) for structure.
- Always read FRONTEND_GUIDELINES.md before implementing UI.
- Always use `fetch` over `axios` in frontend.
- Always use Integer Primary Keys (no UUID for MVP).

## Documentation Index

| Document | Purpose |
|----------|---------|
| [CURRENT_CONTEXT.md](CURRENT_CONTEXT.md) | Current epic, phase, and status |
| [PROJECT_MEMORY.md](PROJECT_MEMORY.md) | Cross-session project memory |
| [CANONICAL_ARCHITECTURE.md](CANONICAL_ARCHITECTURE.md) | Frozen architecture specification |
| [ARCHITECTURE_DECISIONS.md](ARCHITECTURE_DECISIONS.md) | Architecture decision records (ADR) |
| [DECISIONS.md](DECISIONS.md) | Detailed decision log |
| [PHASE_PLAN.md](PHASE_PLAN.md) | High-level epic roadmap |
| [FRONTEND_GUIDELINES.md](FRONTEND_GUIDELINES.md) | UI rules and theme |
| [PROJECT_BRIEF_VI.md](PROJECT_BRIEF_VI.md) | Project brief (Vietnamese) |
| [PROJECT_BRIEF_EN.md](PROJECT_BRIEF_EN.md) | Project brief (English) |
| [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) | Database schema documentation |
| [API_INVENTORY.md](API_INVENTORY.md) | API endpoint inventory |
| [TECH_DEBT.md](TECH_DEBT.md) | Technical debt log |
| [phases/](phases/) | Per-epic detailed phase plans |
