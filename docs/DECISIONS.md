# DECISIONS.md

Architectural Decision Records for Web-AI / ViecConnect IT Jobs.

---

## Decision-001: Admin Web is a Separate Application

**Date:** 2026-06-09
**Status:** Accepted

### Context

The admin dashboard has different security requirements, deployment cadence, and user experience from the public-facing user web application.

### Decision

Admin Web (`apps/admin-web/`) is a separate React application from User Web (`apps/user-web/`). They share the same FastAPI backend.

### Consequences

- Two separate frontend build pipelines
- Independent deployment of admin vs user web
- Clearer security boundary at the application level
- Some shared component duplication possible (mitigated by shared package later if needed)

---

## Decision-002: Login and Register are Dedicated Pages

**Date:** 2026-06-09
**Status:** Accepted

### Context

Authentication pages need focused UX, no distractions, and dedicated URL routes for bookmarking and redirects.

### Decision

Login and Register are dedicated pages (e.g., `/login`, `/register`) — not modals or inline forms.

### Consequences

- Clear URL structure for auth flows
- Simpler redirect logic after login
- Better SEO and bookmarking
- Full-page focus on authentication UX

---

## Decision-003: CV Scoring is Rule-Based First, AI Explains Afterward

**Date:** 2026-06-09
**Status:** Accepted

### Context

CV matching quality scores need to be deterministic, fast, and explainable. Pure AI scoring can be inconsistent and opaque.

### Decision

CV scoring uses rule-based algorithms for the primary score calculation. AI (DeepSeek) is used afterward to generate human-readable explanations of the score and personalized improvement suggestions.

### Consequences

- Deterministic, reproducible scores
- Faster scoring (no AI call for every match)
- AI adds qualitative value without affecting the score itself
- Rule engine must be maintained as scoring criteria evolve

---

## Decision-004: Jobs Data Must Pass Validation Pipeline Before DB Insertion

**Date:** 2026-06-09
**Status:** Accepted

### Context

Job data comes from multiple sources with varying quality. Dirty data in the database creates downstream problems for matching, search, and display.

### Decision

All jobs data must pass through a pipeline before database insertion:

```
Validation → Cleaning → Deduplication → Normalization → Skill Extraction
```

Only after completing all stages can data enter the database.

### Consequences

- Higher data quality guarantees
- Slower ingestion (acceptable — batch process, not real-time)
- Each stage is independently testable
- Skill extraction enables better matching downstream
