# ARCHITECTURE_DECISIONS.md

Architecture Decision Records for Web-AI / ViecConnect IT Jobs.

---

## ADR-001

**Decision:** Admin Web is separate from User Web

**Reason:** Different roles, permissions and workflows.

**Status:** Approved

---

## ADR-002

**Decision:** Login and Register are standalone pages

**Reason:** Better security and scalability.

**Status:** Approved

---

## ADR-003

**Decision:** Rule-based scoring before AI explanation

**Reason:** Transparent and explainable scoring.

**Status:** Approved

---

## ADR-004

**Decision:** Single Backend architecture

**Reason:** Simpler MVP maintenance.

**Status:** Approved

---

## ADR-005

**Decision:** No microservices before production scale

**Reason:** Avoid unnecessary complexity.

**Status:** Approved

---

## ADR-006

**Decision:** All AI calls go through AI Gateway

**Reason:** Centralized control and monitoring.

**Status:** Approved

---

## ADR-007

**Decision:** Jobs Pipeline required before database insertion

**Reason:** Ensure data quality.

**Status:** Approved

---

## ADR-008

**Decision:** CareerLink crawler must pass through pipeline

**Reason:** Prevent dirty data entering the system.

**Status:** Approved
