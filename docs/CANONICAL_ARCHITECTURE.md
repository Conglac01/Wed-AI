# CANONICAL_ARCHITECTURE.md

**Architecture Frozen v1.1** — 2026-06-09

> This architecture is frozen. No structural changes without a new ADR and explicit approval.

## Repository

**Web-AI**

## Product

**ViecConnect IT Jobs**

## Admin

**ViecConnect Admin**

---

## Architecture Overview

Web-AI is a multi-application monorepo with three distinct deployable units:

```text
┌─────────────────────────────────────────────────┐
│                  Web-AI Repo                     │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ Backend  │  │ User Web │  │ Admin Web│      │
│  │ FastAPI  │  │  React   │  │  React   │      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘      │
│       │              │              │            │
│       └──────────────┼──────────────┘            │
│                      │                           │
│              ┌───────┴───────┐                   │
│              │  PostgreSQL   │                   │
│              └───────┬───────┘                   │
│                      │                           │
│              ┌───────┴───────┐                   │
│              │  AI Gateway   │                   │
│              │  (DeepSeek)   │                   │
│              └───────────────┘                   │
└─────────────────────────────────────────────────┘
```

## Backend Structure

```text
app/
├── core/            # Config, security, startup
├── db/              # Session, migrations, base models
├── api/             # API router aggregation, middleware
├── shared/          # Shared schemas, utils, enums
├── observability/   # Logging, metrics, tracing
├── infrastructure/  # File storage, AI gateway, cache
├── workers/         # Background tasks, queues
└── modules/         # Business logic modules
    ├── identity/    # Auth, registration, profiles
    ├── jobs/        # Job CRUD, search, pipeline
    ├── cv/          # CV upload, parsing, analysis
    ├── matching/    # Rule-based scoring, AI explanations
    ├── interview/   # AI interview engine
    ├── chatbot/     # Career assistant chatbot
    ├── quota/       # Usage quotas and limits
    └── admin/       # Admin dashboard APIs
```

## Modules

| Module     | Purpose                                               |
|------------|-------------------------------------------------------|
| identity   | Authentication, registration, user profiles           |
| jobs       | Job listing, search, filtering, data pipeline         |
| cv         | CV upload, parsing, quality analysis                  |
| matching   | CV-to-job rule-based scoring + AI explanations        |
| interview  | AI-powered mock interviews                            |
| chatbot    | Career assistant chatbot                              |
| quota      | AI usage quotas, rate limiting                        |
| admin      | Admin dashboard, user/job management, analytics       |

## Standard Module Pattern

Every module follows this structure:

```text
module_name/
├── router.py       # API endpoints
├── schema.py       # Pydantic request/response schemas
├── model.py        # SQLAlchemy models
├── repository.py   # Data access layer
├── service.py      # Business logic
└── tests/          # Module-specific tests
```

## Application Boundaries

### Backend (`apps/backend/`)

- FastAPI REST API
- Handles all business logic
- Database access layer
- File upload processing
- AI Gateway integration
- Serves both User Web and Admin Web

### User Web (`apps/user-web/`)

- React + TypeScript + Vite + Tailwind
- Public-facing IT job platform
- CV upload and management
- Job browsing and matching
- AI interview interface
- Career chatbot

### Admin Web (`apps/admin-web/`)

- React + TypeScript + Vite + Tailwind
- Separate application from User Web
- Admin dashboard and controls
- Job data management
- User management
- System analytics

## Data Flow

```text
User → User Web → Backend API → PostgreSQL
                       ↓
                  AI Gateway (DeepSeek)
                       ↓
                  AI Response → Backend → User Web → User

Admin → Admin Web → Backend API → PostgreSQL
```

## Key Architectural Decisions

See [ARCHITECTURE_DECISIONS.md](ARCHITECTURE_DECISIONS.md) for ADR-001 through ADR-008.
See [DECISIONS.md](DECISIONS.md) for the detailed decision log.

## Technology Stack

| Component     | Technology                            |
|---------------|---------------------------------------|
| Backend       | FastAPI (Python)                      |
| User Web      | React + TypeScript + Vite + Tailwind  |
| Admin Web     | React + TypeScript + Vite + Tailwind  |
| Database      | PostgreSQL                            |
| AI            | DeepSeek via AI Gateway               |
| Auth          | JWT HS256 (stateless, Epic 1.3)       |
| File Storage  | Local filesystem (S3 in Epic 9)       |
| Caching       | TBD                                   |

## Design Decisions

| Decision                           | Rationale                                               |
|------------------------------------|---------------------------------------------------------|
| Integer Primary Keys               | Simpler, smaller indexes, human-readable. No UUID.      |
| Soft delete (`deleted_at`)         | Foundation across all modules. No hard deletes.         |
| Stateless JWT                      | No refresh_tokens table or blacklist for MVP.           |
| Repository + Service pattern       | Separation of concerns: data access vs business logic.  |
| Flat module structure              | One file per concern per module. No sub-folders.        |
| Shared BaseEntity mixin            | Reusable across future modules (Jobs, CV, etc.).        |
| Token storage: localStorage (MVP)  | Simple client-side persistence; no HttpOnly cookies.    |
| Login + Register separate pages    | Dedicated `/login` and `/register` routes, not modals.  |
| Separate Admin / User Web apps     | Different roles, permissions, feature sets per app.     |
