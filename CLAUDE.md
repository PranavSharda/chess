# Chess Analysis App

Full-stack chess game analysis platform with Chess.com integration and browser-based Stockfish engine.

## Tech Stack

- **Backend:** Python 3.12, FastAPI, SQLAlchemy 2.0, PostgreSQL 17, Alembic, JWT auth (Argon2)
- **Frontend:** React 18, Vite, React Router 6, Axios, react-chessboard, chess.js, Stockfish WASM
- **Infra:** Docker Compose (Postgres + API), Poetry (backend), npm (frontend)

## Project Structure

```
backend/
  main.py              # FastAPI entry point, CORS, routers
  api/                 # Route handlers (user.py, chess.py)
  core/                # Config (env), auth (JWT)
  db/                  # Models, repositories, sessions, dependencies
  schema/              # Pydantic request/response schemas
  services/            # Chess.com API client
  migrations/          # Alembic versions

frontend/
  src/
    App.jsx            # Router: /, /signup, /signin, /dashboard, /analysis, /analyze-game
    components/        # Header, Logo
    pages/             # Home, SignUp, SignIn, Dashboard, Analysis, AnalyzeGame
    services/api.js    # Axios instance with JWT interceptors
    engine/            # Stockfish WASM web worker integration
    contexts/          # ThemeContext (light/dark)
```

## Commands

```bash
# Full stack
make dev                # Start DB + backend + frontend
make install.all        # Install all deps

# Backend
make run.backend        # FastAPI on :8000
make format             # Black
make lint               # Ruff
make lint.fix           # Ruff auto-fix

# Frontend
make frontend.dev       # Vite dev server on :3000
make frontend.build     # Production build

# Database
make services.db        # Start Postgres on :5433
make migrate.create m="msg"
make migrate.upgrade    # alembic upgrade head
make migrate.downgrade

# Docker
make services.backend   # DB + API containers
make services.down
```

## API Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/health` | No | Health check |
| POST | `/user` | No | Signup (returns JWT) |
| POST | `/user/signin` | No | Login (returns JWT) |
| GET | `/user/me` | Yes | Current user profile |
| PATCH | `/user/{id}/chess-com` | Yes | Link Chess.com username |
| GET | `/games` | Yes | List user's stored games |
| POST | `/games/fetch` | Yes | Fetch from Chess.com API |

API docs: `http://localhost:8000/docs`

## Key Patterns

- **Auth flow:** JWT in localStorage, Axios request interceptor attaches Bearer token, 401 response triggers auto-logout
- **DB access:** Repository pattern (`db/repository.py` base, `db/repositories.py` for User/UserGame)
- **Game analysis:** Game data passed via sessionStorage between Analysis → AnalyzeGame pages. Stockfish runs in Web Worker at depth 18, MultiPV 3
- **Chess.com integration:** Backend fetches via public API, deduplicates by `chess_com_game_uuid`

## Environment

Backend `.env` in `backend/`:
```
DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
JWT_SECRET_KEY, JWT_ALGORITHM, JWT_EXPIRATION_MINUTES
```

Frontend: `VITE_API_URL` (defaults to `http://localhost:8000`). Vite proxies `/api` → backend.

## Product Vision

The app's goal is to help chess players improve by deeply analyzing their own games and generating personalized training material.

### Features (Current & Planned)

**1. Game Import & Stockfish Analysis (partially built)**
- Fetch games from Chess.com (done)
- Analyze positions with Stockfish WASM in browser (done, depth 18, MultiPV 3)
- Batch/deeper analysis may move server-side for puzzle generation

**2. Trend Analysis (planned)**
- Win/loss rate over time
- Performance breakdown by time control (rapid, blitz, bullet)
- Opening accuracy trends
- Blunder/mistake frequency over time
- Rating progression
- Common positions where the user repeatedly makes mistakes (pattern detection)

**3. Puzzle Generation (planned)**
- Auto-generate puzzles from the user's own games
- Detect critical moments: positions where the user blundered AND positions where the opponent blundered (missed tactics)
- Turn these into interactive puzzles with the correct solution line from Stockfish

**4. Puzzle Categorization (planned)**
- Primarily tactical themes: pins, forks, skewers, discovered attacks, back rank mates, deflection, decoy, etc.
- Some positional/endgame categories and difficulty tiers as a secondary axis
- Each generated puzzle gets tagged with one or more categories

**5. AI Chatbot for Puzzle Serving (planned)**
- User describes what they want to practice in natural language (e.g. "I keep missing forks", "give me hard puzzles from my last 10 games", "practice endgames")
- Chatbot maps the request to the nearest puzzle category/filter
- Serves matching puzzles from the user's personalized puzzle set
- LLM provider TBD

## Known Issues

- Frontend structure needs significant cleanup — pages are large monolithic components with inline styles, no shared UI primitives, and inconsistent patterns
