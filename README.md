# Web-AI — ViecConnect IT Jobs

Nền tảng tuyển dụng CNTT thông minh sử dụng AI.

## Trạng Thái Dự Án

**✅ Epic 2 — Jobs Platform** — Phase 2.8.3 hoàn thành (2026-06-11)

| Thành Phần         | Trạng Thái                                      |
|-------------------|--------------------------------------------------|
| FastAPI Backend   | ✅ Hoạt động — 154 tests, 0 lỗi                   |
| User Web (React)  | ✅ Giao diện jobs, search, filter, detail         |
| Admin Web (React) | 📅 Đã scaffold, đang phát triển                   |
| CareerLink Sync   | ⛔ Bị chặn bởi hCaptcha (2026-06-11)              |
| CSV Import        | ✅ Fallback chính — 20 jobs IT Việt Nam           |
| Mock Jobs         | ✅ 18 jobs mẫu                                    |
| Auth (JWT)        | ✅ Đăng ký / Đăng nhập / Refresh token            |

## Kiến Trúc

```
apps/
├── backend/              # FastAPI REST API (Python)
│   └── app/modules/jobs/
│       ├── parsers/      # CareerLink HTML parsers (JSON-LD + listing)
│       ├── sources/      # Mock, CSV, CareerLink (BaseJobSource ABC)
│       ├── pipeline/     # 8-stage import pipeline (validate → persist)
│       ├── crawler/      # Safe crawl guard (captcha detection)
│       └── tests/        # 154 tests + HTML fixtures
├── user-web/             # React + TypeScript + Vite + Tailwind
└── admin-web/            # React admin dashboard (separate app)
```

## Nguồn Dữ Liệu Jobs

| Nguồn        | Loại   | Trạng Thái                | Mô Tả                                   |
|-------------|--------|---------------------------|------------------------------------------|
| CSV         | File   | ✅ Primary (fallback)     | 20 jobs CNTT Việt Nam thực tế            |
| Mock        | Code   | ✅ Backup                 | 18 jobs mẫu curated                      |
| CareerLink  | Web    | ⛔ Blocked (2026-06-11)   | hCaptcha anti-bot — safe failure active  |

## Job Import Pipeline (8 Stages)

```
Source → Validate → Clean → In-Batch Dedup → DB Dedup → Normalize → Extract Skills → Quality Score → Persist
```

- Mọi job đều qua pipeline — không ghi trực tiếp vào DB
- Deduplication hoạt động trên (title, company_name, location)
- Quality score tính tự động dựa trên độ đầy đủ của thông tin

## Safe Crawler Guard (Phase 2.8.3)

Khi nguồn web bị chặn (hCaptcha/403/429):

1. Phát hiện trang chặn qua `is_blocked_response()`
2. Log: `CAPTCHA_DETECTED` → dừng ngay
3. Trả về structured summary với `status: "blocked"`
4. Tự động fallback sang nguồn CSV

## Công Nghệ

| Lớp         | Công Nghệ                             |
|------------|---------------------------------------|
| Backend    | FastAPI + SQLAlchemy + PostgreSQL     |
| User Web   | React + TypeScript + Vite + Tailwind  |
| Admin Web  | React + TypeScript + Vite + Tailwind  |
| AI         | DeepSeek qua AI Gateway               |
| Auth       | JWT HS256 (stateless)                 |
| Crawler    | Crawl4AI + Playwright (headless)      |

## Chạy Dự Án

```bash
# Backend
cd apps/backend
source .venv/bin/activate
uvicorn app.main:app --reload

# User Web
cd apps/user-web
npm run dev

# Admin Web
cd apps/admin-web
npm run dev -- --port 5174

# Sync CareerLink (hiện bị chặn)
python scripts/sync_careerlink.py --limit 50

# Import CSV jobs
python scripts/import_jobs_csv.py --file data/sample/jobs_bulk.csv
```

## API Endpoints

| Method | Path                      | Mô Tả                    |
|--------|---------------------------|--------------------------|
| GET    | /api/v1/jobs              | Danh sách jobs (có filter)|
| GET    | /api/v1/jobs/{id}         | Chi tiết job             |
| GET    | /api/v1/jobs/health       | Health check             |
| POST   | /api/v1/auth/register     | Đăng ký                  |
| POST   | /api/v1/auth/login        | Đăng nhập                |

## Test Suite

```bash
cd apps/backend
pytest -q
# 154 tests, 0 failures
```

## Tài Liệu

- [CLAUDE.md](CLAUDE.md) — Agent rules
- [docs/CURRENT_CONTEXT.md](docs/CURRENT_CONTEXT.md) — Trạng thái hiện tại
- [docs/CANONICAL_ARCHITECTURE.md](docs/CANONICAL_ARCHITECTURE.md) — Kiến trúc
- [docs/PROJECT_MEMORY.md](docs/PROJECT_MEMORY.md) — Bài học & quyết định
- [docs/PHASE_PLAN.md](docs/PHASE_PLAN.md) — Lộ trình epic
