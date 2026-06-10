# Web-AI

**Product:** ViecConnect IT Jobs

A modern AI-powered IT career platform.

## Features

- IT Job Discovery
- CV Upload & Parsing
- CV Quality Analysis
- CV Matching
- AI Interview
- Career Assistant Chatbot
- Admin Dashboard

## Core MVP Flow

1. Register/Login
2. Browse Jobs
3. View Job Detail
4. Upload CV
5. Parse CV
6. Select Job
7. CV Matching
8. Match Score
9. Missing Skills
10. Learning Path
11. Admin Dashboard

## Technology Direction

| Layer       | Technology                        |
|------------|-----------------------------------|
| Backend    | FastAPI                           |
| User Web   | React + TypeScript + Vite + Tailwind |
| Admin Web  | React + TypeScript + Vite + Tailwind |
| Database   | PostgreSQL                        |
| AI         | DeepSeek through AI Gateway       |

## Project Structure

```
Web-AI/
├── apps/
│   ├── backend/          # FastAPI backend
│   ├── user-web/         # React user-facing web app
│   └── admin-web/        # React admin dashboard
├── docs/                 # Project documentation
├── data/                 # Data pipeline directories
├── storage/              # File upload storage
├── research/             # Research and experiments
├── scripts/              # Utility scripts
├── CLAUDE.md             # Claude agent instructions
├── AGENTS.md             # Agent configuration
└── README.md             # This file
```

## Status

🚧 **Epic 0.1 — Skeleton Repository** — In Progress

- FastAPI not implemented yet
- React not implemented yet
- Backend foundation starts in Epic 0.3
- Frontend foundation starts in Epic 0.4
