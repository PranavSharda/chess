SHELL := /bin/bash
default: help

ENV_FILE=backend/.env

# ============
# Help
# ============

help:
	@echo "Available commands:"
	@echo ""
	@echo "  Backend:"
	@echo "    make services.backend   - Start backend services (postgres, api)"
	@echo "    make services.db        - Start only database"
	@echo "    make services.down      - Stop all services"
	@echo "    make run.backend        - Run FastAPI backend"
	@echo "    make install            - Install backend dependencies"
	@echo ""
	@echo "  Frontend:"
	@echo "    make frontend.install   - Install frontend dependencies"
	@echo "    make frontend.dev       - Start frontend dev server"
	@echo "    make frontend.build     - Build frontend for production"
	@echo "    make frontend.preview   - Preview production build"
	@echo "    make frontend.clean     - Remove node_modules and dist"
	@echo ""
	@echo "  Full Stack:"
	@echo "    make dev                - Start both backend and frontend"
	@echo "    make install.all        - Install all dependencies"
	@echo ""
	@echo "  Migrations:"
	@echo "    make migrate.create     - Create new migration (use m='message')"
	@echo "    make migrate.upgrade    - Apply migrations"
	@echo "    make migrate.downgrade  - Rollback latest migration"
	@echo "    make migrate.history    - Show migration history"
	@echo ""
	@echo "  Code Quality:"
	@echo "    make format             - Format backend code with black"
	@echo "    make lint               - Lint backend code with ruff"

# ============
# Docker Services
# ============

services.backend:
	cd backend && docker-compose up --build --force-recreate

services.db:
	cd backend && docker-compose up -d postgres

services.down:
	cd backend && docker-compose down

services.logs:
	cd backend && docker-compose logs -f

services.ps:
	cd backend && docker-compose ps

# ============
# Backend (FastAPI)
# ============

run.backend:
	cd backend && poetry run uvicorn main:app --reload --host 0.0.0.0 --port 8000

run.shell:
	cd backend && poetry shell

# ============
# Dependencies
# ============

install:
	cd backend && poetry install

update:
	cd backend && poetry update

# ============
# Alembic Migrations
# ============

migrate.create:
	cd backend && poetry run alembic revision --autogenerate -m "$(m)"

migrate.upgrade:
	cd backend && poetry run alembic upgrade head

migrate.downgrade:
	cd backend && poetry run alembic downgrade -1

migrate.history:
	cd backend && poetry run alembic history

migrate.current:
	cd backend && poetry run alembic current

# ============
# Code Quality
# ============

format:
	cd backend && poetry run black .

lint:
	cd backend && poetry run ruff check .

lint.fix:
	cd backend && poetry run ruff check --fix .

# ============
# Database
# ============

db.connect:
	cd backend && psql -h localhost -U $$(grep DB_USER $(ENV_FILE) | cut -d '=' -f2) -d $$(grep DB_NAME $(ENV_FILE) | cut -d '=' -f2)

# ============
# Environment
# ============

env.show:
	@cat $(ENV_FILE) | grep -v PASSWORD || echo "No .env file found"

env.template:
	@echo "DB_HOST=localhost"
	@echo "DB_PORT=5432"
	@echo "DB_NAME=chess_db"
	@echo "DB_USER=chess_user"
	@echo "DB_PASSWORD=dev_password"

# ============
# Frontend
# ============

frontend.install:
	cd frontend && npm install

frontend.dev:
	cd frontend && npm run dev

frontend.build:
	cd frontend && npm run build

frontend.preview:
	cd frontend && npm run preview

frontend.clean:
	cd frontend && rm -rf node_modules dist

# ============
# Full Stack
# ============

install.all: install frontend.install
	@echo "All dependencies installed!"

dev:
	@echo "Starting database..."
	@make services.db
	@echo "Waiting for database to be ready..."
	@sleep 3
	@echo "Starting backend and frontend..."
	@make -j2 run.backend frontend.dev

clean.all:
	cd backend && rm -rf __pycache__ .pytest_cache
	cd frontend && rm -rf node_modules dist
