# Identity Module

## Purpose

User domain foundation for ViecConnect IT Jobs.

## Responsibilities

* User model
* User roles
* Repository layer
* Service layer
* Soft delete support
* Password hashing (bcrypt)
* JWT token creation & validation (HS256)
* Register / Login / Refresh / Current User APIs
* Auth dependency (`get_current_user`)

## Module Files

| File            | Purpose                               |
|-----------------|---------------------------------------|
| `constants.py`  | `UserRole` enum (user, admin)         |
| `model.py`      | `User` SQLAlchemy model (table users) |
| `schema.py`     | Pydantic request/response schemas     |
| `repository.py` | Data access layer                     |
| `service.py`    | Business logic + auth operations      |
| `dependencies.py` | FastAPI auth dependency             |
| `router.py`     | Auth API endpoints                    |

## Architecture Notes

BaseEntity provides:

* id
* created_at
* updated_at
* deleted_at

Integer Primary Key used.

UUID not used.

## API Endpoints

Prefix: `/api/v1/auth`

| Method | Path      | Auth          | Description           |
|--------|-----------|---------------|-----------------------|
| POST   | /register | No            | Register new user     |
| POST   | /login    | No            | Login — return tokens |
| POST   | /refresh  | Refresh token | Refresh access token  |
| GET    | /me       | Access token  | Get current user      |

## Module Status

Auth API Complete

Owner Epic:

Epic 1 — Identity / Auth

Current Phase:

Epic 1.3 — Authentication API (Complete)

Next Phase:

Epic 1.4 — Auth UI
