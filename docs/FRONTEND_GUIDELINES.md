# FRONTEND_GUIDELINES.md

UI rules for Web-AI / ViecConnect IT Jobs. No UI code — rules only.

## Theme

**Blue + White** — Modern IT Recruitment Platform

## Homepage Sections

1. **Navbar** — Logo, navigation links, auth buttons
2. **Hero Search** — Main search bar with job title/keyword input
3. **Category Dropdown** — IT job categories (Developer, Tester, DevOps, etc.)
4. **AI Interview Banner** — Promotional banner for AI interview feature
5. **Jobs Section** — Featured and recent job listings
6. **Top Companies Section** — Logos of top hiring companies
7. **Career Blog Section** — Career advice and industry articles
8. **Newsletter Section** — Email subscription form
9. **Footer** — Links, contact info, social media

## Language Rules

- User-facing content: **Vietnamese**
- Technical names: **English** (e.g., DevOps, React, Python)

## Application Separation

- **User Web** (`apps/user-web/`) — Public-facing job platform
- **Admin Web** (`apps/admin-web/`) — Separate application, different UI
- **Login** — Dedicated page (`/login`)
- **Register** — Dedicated page (`/register`)

## Tech Stack

- React + TypeScript + Vite + Tailwind CSS
