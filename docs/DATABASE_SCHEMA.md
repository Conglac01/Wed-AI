# DATABASE_SCHEMA.md

Database schema documentation for Web-AI / ViecConnect IT Jobs.

## Database

**PostgreSQL**

## Tables

### users

| Column        | Type                     | Constraints                  |
|---------------|--------------------------|------------------------------|
| id            | Integer                  | PRIMARY KEY, AUTOINCREMENT   |
| email         | String(255)              | NOT NULL, UNIQUE, INDEXED    |
| password_hash | String(255)              | NOT NULL                     |
| full_name     | String(255)              | NULLABLE                     |
| role          | Enum (user, admin)       | NOT NULL, DEFAULT 'user'     |
| is_active     | Boolean                  | NOT NULL, DEFAULT TRUE       |
| created_at    | DateTime                 | NOT NULL                     |
| updated_at    | DateTime                 | NOT NULL                     |
| deleted_at    | DateTime                 | NULLABLE                     |

**Indexes:**

* `ix_users_email` — unique index on `email`

**Notes:**

* Integer Primary Key — no UUID.
* `deleted_at` supports soft delete across all modules.
* `password_hash` stores hashed passwords only — never raw.
* `role` uses `UserRole` enum: `user` | `admin`.

## Migrations

Managed via Alembic. Two migrations applied:

* `001_create_users_table.py` — creates `users` table
* `002_create_jobs_table.py` — creates `jobs` table

**Status:** Both applied (2026-06-10) — PostgreSQL `web_ai` database running locally.

```bash
cd apps/backend
source .venv/bin/activate
alembic upgrade head
```

### jobs

| Column           | Type                | Constraints                  |
|------------------|---------------------|------------------------------|
| id               | Integer             | PRIMARY KEY, AUTOINCREMENT   |
| title            | String(500)         | NOT NULL                     |
| company_name     | String(255)         | NOT NULL                     |
| company_logo_url | String(1024)        | NULLABLE                     |
| location         | String(255)         | NOT NULL                     |
| salary_text      | String(255)         | NULLABLE                     |
| salary_min       | Integer             | NULLABLE                     |
| salary_max       | Integer             | NULLABLE                     |
| skills           | JSONB               | NULLABLE                     |
| description      | Text                | NOT NULL                     |
| requirements     | Text                | NULLABLE                     |
| benefits         | Text                | NULLABLE                     |
| deadline         | String(50)          | NULLABLE                     |
| source_name      | String(100)         | NULLABLE                     |
| source_url       | String(1024)        | NULLABLE                     |
| quality_score    | Float               | NOT NULL, DEFAULT 0.0        |
| is_active        | Boolean             | NOT NULL, DEFAULT TRUE       |
| created_at       | DateTime            | NOT NULL                     |
| updated_at       | DateTime            | NOT NULL                     |
| deleted_at       | DateTime            | NULLABLE                     |

**Notes:**

* `skills` uses PostgreSQL JSONB for structured multi-skill storage.
* `quality_score` defaults to 0.0 — used by the validation pipeline.
* Soft delete via `deleted_at` column (inherited from BaseEntity).
