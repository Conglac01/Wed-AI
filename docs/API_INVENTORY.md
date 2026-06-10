# API_INVENTORY.md

API endpoint inventory for Web-AI / ViecConnect IT Jobs.

## Base URL

`http://127.0.0.1:8000`

## Health

| Method | Path    | Auth | Description          |
|--------|---------|------|----------------------|
| GET    | /health | No   | Backend health check |

## Auth

Prefix: `/api/v1/auth`

| Method | Path                        | Auth          | Description              |
|--------|-----------------------------|---------------|--------------------------|
| POST   | /api/v1/auth/register       | No            | Register new user        |
| POST   | /api/v1/auth/login          | No            | Login — return tokens    |
| POST   | /api/v1/auth/refresh        | Refresh token | Refresh access token     |
| GET    | /api/v1/auth/me             | Access token  | Get current user         |

### Register

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secret123",
  "full_name": "Nguyen Van A"
}

→ 201 Created
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "Nguyen Van A",
  "role": "user",
  "is_active": true,
  "created_at": "...",
  "updated_at": "..."
}
```

### Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secret123"
}

→ 200 OK
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

### Refresh

```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJ..."
}

→ 200 OK
{
  "access_token": "eyJ...",
  "refresh_token": null,
  "token_type": "bearer"
}
```

### Current User

```http
GET /api/v1/auth/me
Authorization: Bearer <access_token>

→ 200 OK
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "Nguyen Van A",
  "role": "user",
  "is_active": true,
  "created_at": "...",
  "updated_at": "..."
}
```

## Notes

* All auth endpoints are prefixed with `/api/v1/auth`.
* JWT authentication via `Authorization: Bearer <token>` header.
* Access tokens expire in 15 minutes. Refresh tokens expire in 7 days.
* Refresh tokens cannot be used to access `/me` — only access tokens.
* **Backend runtime verified:** All 4 auth endpoints tested via curl (2026-06-10). ✅
* **Frontend integrated:** User-web login/register/auth flow connected (Epic 1.4). ✅
* API inventory will be populated module by module as epics progress.
