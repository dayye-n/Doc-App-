# ENT Note Builder

Fast, click-first ENT clinical note builder with anatomy-driven procedure templates, built with React (Vite + TypeScript + Tailwind) and FastAPI + PostgreSQL.

## Tech stack
- Frontend: React 19 + TypeScript + Vite + TailwindCSS
- Backend: FastAPI, SQLAlchemy 2.0, Alembic, JWT auth
- Database: PostgreSQL (via Docker Compose)
- PDF: reportlab

## Quick start (Docker)
1. `docker compose up --build`
2. Backend available at `http://localhost:8000`, frontend dev server at `http://localhost:5173` (run separately).

## Backend (FastAPI)
```bash
cd backend
python -m venv .venv
.\\.venv\\Scripts\\activate        # PowerShell: .venv\\Scripts\\Activate.ps1
pip install -r requirements.txt
copy .env.example .env             # update secrets as needed

# Run migrations
alembic upgrade head

# Start API
uvicorn app.main:app --reload --port 8000
```

### Alembic commands
- Create migration: `alembic revision --autogenerate -m "message"`
- Apply migrations: `alembic upgrade head`

### Tests
```bash
cd backend
pytest
```

## Frontend (Vite React)
```bash
cd frontend
npm install
copy .env.example .env.local       # adjust API URL if needed
npm run dev                        # http://localhost:5173
```

## Environment variables
- `DATABASE_URL` (e.g. `postgresql+psycopg2://ent_user:ent_password@localhost:5432/ent_db`)
- `JWT_SECRET` (change in production)
- `JWT_ALGORITHM` (default `HS256`)
- `ACCESS_TOKEN_EXPIRE_MINUTES` (default 480)
- `CORS_ORIGINS` (comma-separated, default `http://localhost:5173`)
- `DEFAULT_ADMIN_EMAIL` / `DEFAULT_ADMIN_PASSWORD` (auto-seeded on startup; defaults to admin@ent.local / ChangeMe123!)
- Frontend: `VITE_API_URL` (default `http://localhost:8000`)

## Features implemented
- Email/password auth (JWT stored in `localStorage`)
- Patient create/list/search
- Clickable SVG anatomy (nose, left/right ear, throat, neck)
- Procedure templates seeded on startup (nose, ear, throat, neck)
- Note builder with encounter date, therapy checklist, follow-up
- Final note editable textbox, copy-to-clipboard, and backend PDF export
- REST API: `/auth/register`, `/auth/login`, `/auth/me`, `/patients`, `/templates`, `/notes`, `/notes/{id}`, `/notes/{id}/pdf`
