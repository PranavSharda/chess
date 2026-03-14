# Frontend Restructure — Implementation Plan

## Context
The frontend works but is monolithic and unscalable. AnalyzeGame.jsx=585 lines, Analysis.jsx=335 lines, no shared UI primitives, hardcoded colors, sessionStorage for game data. This restructure creates a proper component architecture with sidebar nav, design tokens, extracted hooks, and route-based game access to support the 5 planned features.

---

## Phase 1: Foundation (do first, everything depends on this)

### 1a. Create folder structure
```bash
mkdir -p frontend/src/{layouts,components/{ui,chess,charts,navigation},hooks,utils,pages}
```
Move existing `Header.jsx/css` and `Logo.jsx/css` → `components/navigation/`

### 1b. Expand design tokens in `frontend/src/index.css`
- Add semantic colors: `--color-win: #22c55e`, `--color-loss: #ef4444`, `--color-draw: #94a3b8`, `--color-blunder: #ef4444`, `--color-mistake: #f59e0b`, `--color-inaccuracy: #eab308`
- Add spacing scale: `--space-xs` through `--space-3xl`
- Add sidebar tokens: `--sidebar-width: 240px`, `--sidebar-bg`, `--sidebar-text`, `--sidebar-active`
- Add board tokens: `--board-light`, `--board-dark`
- Add `--radius-sm/md/lg`, `--font-size-xs/sm/md/lg/xl`
- Dark mode overrides for all new tokens via `[data-theme='dark']`

### 1c. Build UI primitives in `components/ui/`
Each gets `.jsx` + `.css` file. Keep minimal — just what's needed now:
- **Button**: `variant` (primary/secondary/ghost/danger), `size` (sm/md/lg), `loading`, `fullWidth`
- **Card**: wrapper with `--shadow-sm`, optional `title` prop
- **Input**: label, error state, `type` prop
- **Select**: label, options array, error state
- **Badge**: `variant` (win/loss/draw/info), colored via design tokens
- **Spinner**: CSS-only spinner, `size` prop
- **EmptyState**: icon/message/action slot
- **ErrorBanner**: red banner with message, dismissible

### 1d. AuthContext (`contexts/AuthContext.jsx`) + `hooks/useAuth.js`
Extract auth logic from current `App.jsx` (lines 15-57):
- `user`, `isAuthenticated`, `isLoading` state
- `login(token)` — saves token, decodes, fetches user via getMe()
- `logout()` — removes token, clears user, navigates to /signin
- `updateUser(data)` — merges user state
- On mount: check token validity, fetch user if valid
- Reuse existing `api.js` functions: `getToken`, `setToken`, `removeToken`, `isTokenExpired`, `decodeToken`

### 1e. Service modules — split `services/api.js`
Keep `api.js` as the Axios instance + interceptors + token helpers.
Extract endpoint calls into:
- `services/auth.js`: `signUp()`, `signIn()`, `getMe()` (move from api.js)
- `services/games.js`: `fetchGames()`, `fetchFromChessCom()`, `getGame(gameId)` (new)

### 1f. Layouts
- **`layouts/PublicLayout.jsx`**: `<Header />` + `<Outlet />` — wraps `/`, `/signin`, `/signup`
- **`layouts/AppShell.jsx` + `AppShell.css`**: `<Sidebar />` + topbar (page title, user avatar, theme toggle) + `<Outlet />`. Auth gate — redirects to `/signin` if not authenticated.

### 1g. Sidebar (`components/navigation/Sidebar.jsx` + `.css`)
- Nav items: Dashboard, Games, Trends, Puzzles, Coach (with icons as text/emoji for now)
- Active state from `useLocation()`
- Theme toggle button at bottom
- Logout button at bottom

### 1h. Rewire `App.jsx` router
```jsx
<AuthProvider>
  <ThemeProvider>
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
      </Route>
      <Route element={<AppShell />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/games" element={<Games />} />
        <Route path="/games/:gameId" element={<GameAnalysis />} />
        <Route path="/trends" element={<Trends />} />
        <Route path="/puzzles" element={<Puzzles />} />
        <Route path="/puzzles/:puzzleId" element={<PuzzleSolver />} />
        <Route path="/coach" element={<Coach />} />
      </Route>
    </Routes>
  </ThemeProvider>
</AuthProvider>
```

---

## Phase 2: Migrate Existing Pages

### 2a. Update Header.jsx for PublicLayout
- Remove auth-specific nav items (Dashboard, Analysis links, logout) — those are in Sidebar now
- Header is only for public pages: Logo + Sign In / Sign Up links + theme toggle
- Update imports for new location (`components/navigation/`)

### 2b. Home.jsx
- Update to use new Button component for CTAs
- Update feature cards to match wireframe (5 features: Deep Analysis, Your Puzzles, AI Coach, Trend Insights, Chess.com Sync)
- Replace hardcoded colors with design tokens

### 2c. SignIn.jsx + SignUp.jsx
- Replace inline form elements with Input + Button components
- Use `useAuth()` hook instead of prop-drilled callbacks
- On success: `auth.login(token)` then `navigate('/dashboard')`

### 2d. Dashboard.jsx
- Use `useAuth()` for user data instead of props
- Replace hardcoded cards with Card + Badge components
- Quick actions link to new routes: `/games`, `/trends`, `/puzzles`, `/coach`
- Stats row: Games imported, Win Rate, Current Rating, Unsolved Puzzles (placeholders for now)

### 2e. Extract utils
- **`utils/formatters.js`**: Extract from Analysis.jsx — `formatDate()`, `formatTimeControl()`, `formatEval()`
- **`utils/chessHelpers.js`**: Extract from AnalyzeGame.jsx — `getGameResult()`, `getOpponent()`, `movePairsFromHistory()`
- **`utils/constants.js`**: `STOCKFISH_DEPTH=18`, `MULTI_PV=3`, `GAMES_PER_PAGE=10`

### 2f. Extract hooks from AnalyzeGame.jsx (585 lines → ~150 line page)

**`hooks/useChessGame.js`** (~120 lines) — Extract from AnalyzeGame.jsx:
- Manages `chess.js` Game instance
- `loadPgn(pgn)` — parses PGN, builds move history array
- `goToMove(index)` — navigate to specific move
- `goForward()`, `goBack()`, `goToStart()`, `goToEnd()`
- `makeMove(move)` — for board exploration
- `syncToGameMove()` — return to actual game line
- Returns: `{ position, currentMoveIndex, moves, moveHistory, isExploring, ... }`

**`hooks/useStockfish.js`** (~60 lines) — Extract from AnalyzeGame.jsx:
- Takes `fen` as input
- Debounces analysis (300ms)
- Manages worker lifecycle
- Returns: `{ topLines, bestMove, evaluation, isAnalyzing }`
- Reuses `engine/stockfishAnalysis.js` (keep as-is)

**`hooks/useBoardSize.js`** (~30 lines) — Extract from AnalyzeGame.jsx:
- Takes container ref
- Uses ResizeObserver
- Returns responsive board size (min 400, max 760)

**`hooks/useKeyboardNav.js`** (~20 lines) — Extract from AnalyzeGame.jsx:
- Takes `{ onLeft, onRight, onHome, onEnd }` callbacks
- Registers/cleans up arrow key listeners

**`hooks/useGames.js`** (~50 lines) — Extract from Analysis.jsx:
- Manages game list fetching, pagination, filters
- Returns: `{ games, total, page, setPage, isLoading, error }`

**`hooks/useGame.js`** (~30 lines) — NEW:
- Takes `gameId` from URL params
- Fetches single game via `GET /games/:gameId`
- Returns: `{ game, isLoading, error }`

### 2g. Extract chess components from AnalyzeGame.jsx

**`components/chess/ChessboardPanel.jsx`** — Wraps react-chessboard:
- Props: `position`, `orientation`, `boardSize`, `onPieceDrop`, `customSquareStyles`
- Includes player name bars above/below board
- Includes EvalBar on left side

**`components/chess/EvalBar.jsx` + `.css`** — Vertical eval indicator:
- Props: `evaluation` (cp or mate value)
- White section grows/shrinks based on advantage
- Use `--color-win`/`--color-loss` tokens (replace hardcoded `#769656`/`#b0b0b0`)

**`components/chess/MoveList.jsx` + `.css`** — Scrollable move table:
- Props: `moves` (paired), `currentMoveIndex`, `onMoveClick`
- Two-column layout (White | Black)
- Highlight current move, auto-scroll

**`components/chess/MoveControls.jsx`** — Navigation buttons:
- Props: `onFirst`, `onPrev`, `onNext`, `onLast`
- Four buttons: |< < > >|

**`components/chess/EngineLines.jsx`** — Top N lines panel:
- Props: `topLines`, `isAnalyzing`, `depth`
- Shows evaluation + move sequence for each line

### 2h. Compose GameAnalysis.jsx (~150 lines)
- Uses `useParams()` to get `gameId`
- `useGame(gameId)` fetches game data
- `useChessGame(game.pgn)` manages game state
- `useStockfish(position)` runs engine
- `useBoardSize(containerRef)` for responsive sizing
- `useKeyboardNav(callbacks)` for arrow keys
- Renders: ChessboardPanel + EngineLines + MoveList + MoveControls + game metadata

### 2i. Compose Games.jsx
- Uses `useGames(filters)` hook
- Import bar: Chess.com username display + timeframe Select + fetch Button
- Filter bar: time control badges, result badges, search Input
- Game list using Card components
- Pagination
- "Analyze" links go to `/games/${game.game_id}` (no sessionStorage)

### 2j. Backend: Add GET `/games/:gameId` endpoint
**File: `backend/api/chess.py`**
- New route: `@router.get("/games/{game_id}")`
- Uses existing `BaseRepository.get_by_id()` — the base class already has this
- Verify `game.user_id == current_user.id` (return 404 if not found or wrong user)
- Return via existing `_game_to_response()` helper

---

## Phase 3: New Feature Pages (stubs with placeholder content)

### 3a. Install recharts
```bash
cd frontend && npm install recharts
```

### 3b. Trends.jsx + Trends.css
- Filter bar: time range Select, time control badges
- Placeholder cards with "Coming soon" or mock chart data
- Chart components in `components/charts/`:
  - `RatingChart.jsx` — recharts LineChart
  - `WinLossChart.jsx` — recharts StackedBarChart
  - `AccuracyChart.jsx` — recharts AreaChart
  - `BlunderFreqChart.jsx` — recharts BarChart
  - `TimeControlPie.jsx` — recharts PieChart
- Use mock/sample data for now

### 3c. Puzzles.jsx + Puzzles.css
- Stats bar (Total, Solved, Unsolved, Streak — all placeholder)
- Category filter badges
- Difficulty filter
- Grid of puzzle Card components with placeholder content
- "Coming soon" messaging

### 3d. PuzzleSolver.jsx + PuzzleSolver.css
- Chessboard (reuse ChessboardPanel)
- Puzzle info panel
- Hint/Solution buttons
- "Coming soon" / placeholder

### 3e. Coach.jsx + Coach.css
- Chat message list area
- Suggested prompt cards (when empty)
- Text input + send button
- "Coming soon" messaging

### 3f. Stub service files
- `services/puzzles.js` — empty exports for `getPuzzles`, `generatePuzzles`
- `services/trends.js` — empty export for `getTrends`
- `services/coach.js` — empty export for `sendMessage`

---

## Phase 4: Polish

### 4a. EvalGraph component (`components/chess/EvalGraph.jsx` + `.css`)
- recharts LineChart showing eval per move
- Clickable — clicking a point navigates to that move
- Add to GameAnalysis page

### 4b. Clean up old files
- Delete `pages/Analysis.jsx`, `pages/Analysis.css`
- Delete `pages/AnalyzeGame.jsx`, `pages/AnalyzeGame.css`
- Remove old Header/Logo from `components/` root (now in `components/navigation/`)
- Delete `App.css` (styles in index.css now)

### 4c. Mobile responsive sidebar
- Below 768px: collapse sidebar to icon-only (40px width)
- Hamburger toggle on topbar

---

## Critical Files Reference

| Current File | What Happens | Key Lines to Extract |
|---|---|---|
| `App.jsx` | Rewrite as router only | Auth logic (15-57) → AuthContext |
| `pages/AnalyzeGame.jsx` | Decompose into 5 hooks + 5 components + GameAnalysis page | Chess logic, stockfish calls, resize, keyboard, eval bar, move list |
| `pages/Analysis.jsx` | Rewrite as Games.jsx | Game fetching, pagination, Chess.com linking |
| `pages/Dashboard.jsx` | Refactor with new components | Keep layout, replace with Card/Badge/Button |
| `pages/SignIn.jsx` | Refactor with AuthContext | Replace prop drilling |
| `pages/SignUp.jsx` | Refactor with AuthContext | Replace prop drilling |
| `pages/Home.jsx` | Update features, use Button | Keep hero, update feature list |
| `services/api.js` | Split into api.js + auth.js + games.js | Keep axios instance, move endpoint calls |
| `index.css` | Expand with full token system | Keep existing tokens, add new |
| `backend/api/chess.py` | Add GET /games/:gameId | Use existing repo + response helper |

---

## Verification

1. `npm run dev` — app starts without errors
2. Auth flow: sign up → sign in → redirects to dashboard
3. Sidebar navigation works across all routes (Dashboard, Games, Trends, Puzzles, Coach)
4. Games page: fetch from Chess.com, filter by time control, paginate, click Analyze
5. GameAnalysis: board renders, Stockfish analyzes positions, move nav works (keyboard + buttons), eval bar updates
6. Theme toggle works on every page — no hardcoded colors visible
7. New stub pages (Trends, Puzzles, Coach) render with placeholder content
8. `npm run build` — no build errors or warnings
