# Chess

A full-stack chess application with game analysis and user management.

## Project structure

| Directory      | Description |
|----------------|-------------|
| **backend/**   | FastAPI API (Python, Poetry) — user auth, chess logic, DB |
| **frontend/**  | React + Vite UI — dashboard, analysis, sign-in/sign-up |
| **scripts/**   | Utility scripts |

## Prerequisites

- **Backend:** Python 3.12+, [Poetry](https://python-poetry.org/), Docker (for PostgreSQL)
- **Frontend:** Node.js 18+, npm

## Quick start

### 1. Install dependencies

```bash
make install.all
```

### 2. Start the app (DB + backend + frontend)

```bash
make dev
```

- **Frontend:** http://localhost:5173  
- **Backend API:** http://localhost:8000  
- **API docs:** http://localhost:8000/docs  

### 3. Backend only (with DB)

```bash
make services.db      # start PostgreSQL
make run.backend      # run FastAPI
```

### 4. Frontend only

```bash
make frontend.install
make frontend.dev
```

Set `VITE_API_URL=http://localhost:8000` in `frontend/.env` if needed.

## Make commands

| Command | Description |
|--------|-------------|
| `make help` | List all targets |
| **Services** | |
| `make services.backend` | Start backend stack (DB + API) with Docker |
| `make services.db` | Start PostgreSQL only |
| `make services.down` | Stop Docker services |
| **Backend** | |
| `make run.backend` | Run FastAPI (expects DB running) |
| `make install` | Install backend deps (Poetry) |
| **Frontend** | |
| `make frontend.install` | Install frontend deps |
| `make frontend.dev` | Start Vite dev server |
| `make frontend.build` | Production build |
| **Migrations** | |
| `make migrate.upgrade` | Apply Alembic migrations |
| `make migrate.create m="message"` | Create new migration |
| **Code quality** | |
| `make format` | Format backend with Black |
| `make lint` | Lint backend with Ruff |

## Backend

- **Stack:** FastAPI, SQLAlchemy, Alembic, PostgreSQL, Argon2
- **Config:** Set env vars required by `backend/core/config.py` in `backend/.env` (DB_*, JWT_*).

## Frontend

- **Stack:** React, Vite
- **Env:** `VITE_API_URL` for the backend base URL (default `http://localhost:8000`).
