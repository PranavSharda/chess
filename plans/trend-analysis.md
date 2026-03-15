# Trend Analysis + Background Analysis Implementation Plan

## Context

The app stores Chess.com games but has no analytics. The Trends page and Dashboard show placeholders. This plan adds:
1. Backend trend computation endpoints + frontend charts (rating, win/loss, time controls, openings)
2. Background Stockfish analysis that fires automatically after game fetch (non-blocking, fire-and-forget)
3. Accuracy and blunder frequency trends powered by the stored analysis data

On analysis success → results saved to DB. On failure → silently skipped, user can retry from Trends page.

---

## Phase 1: Database Changes

**Modify** `backend/db/models.py`:

Add to `UserGame`:
```python
white_rating = Column(Integer, nullable=True)
black_rating = Column(Integer, nullable=True)
```

Add new model:
```python
class GameAnalysis(Base):
    __tablename__ = "game_analysis"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    game_id = Column(UUID(as_uuid=True), ForeignKey("user_games.game_id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    move_number = Column(Integer, nullable=False)         # 1-based half-move index
    fen = Column(String, nullable=False)
    side_to_move = Column(String, nullable=False)         # 'w' or 'b'
    eval_type = Column(String, nullable=False)            # 'cp' or 'mate'
    eval_value = Column(Integer, nullable=False)          # centipawns or moves-to-mate (white perspective)
    best_move = Column(String, nullable=True)             # UCI notation
    played_move = Column(String, nullable=True)           # UCI notation of actual move played
    classification = Column(String, nullable=True)        # 'blunder', 'mistake', 'inaccuracy', 'good', 'excellent'
```

**Classification thresholds** (eval swing from player's perspective):
- Blunder: >= 200cp drop; Mistake: >= 100cp; Inaccuracy: >= 50cp; else Good/Excellent

**Create** Alembic migration: `make migrate.create m="add_ratings_and_analysis"`

---

## Phase 2: Store Ratings on Fetch

**Modify** `backend/services/chess_com.py` — in `games.append(...)`, add:
```python
"white_rating": white.get("rating"),
"black_rating": black.get("rating"),
```

**Modify** `backend/api/chess.py`:
- Add `white_rating` and `black_rating` to `user_game_repo.create(...)` call (line 102-115)
- In `_game_to_response`, add `"rating"` key to white/black dicts

---

## Phase 3: Analysis Storage Endpoints

**Create** `backend/api/analysis.py`:

| Endpoint | Purpose |
|----------|---------|
| `POST /games/{game_id}/analysis` | Bulk save move-by-move analysis for a game (array of move analyses). Replaces existing analysis (delete + insert). |
| `GET /games/{game_id}/analysis` | Retrieve stored analysis for a game |
| `GET /games/unanalyzed` | Return game IDs that have no analysis stored (for retry) |

**Modify** `backend/db/repositories.py` — add `GameAnalysisRepository` with `bulk_create`, `get_by_game_id`, `delete_by_game_id`, `get_analyzed_game_ids(user_id)`.

**Modify** `backend/db/dependencies.py` — add DI for `GameAnalysisRepository`.

**Modify** `backend/main.py` — register analysis router.

---

## Phase 4: Frontend — Background Analysis Engine

Fire-and-forget system that runs after fetch without blocking UI.

### Architecture
```
App.jsx
  └── BackgroundAnalysisProvider (context at app root, survives navigation)
        └── single persistent Stockfish Web Worker
        └── queue of games to analyze
        └── processes positions sequentially
        └── POSTs results to backend per game on completion
```

### Files

**Create** `frontend/src/engine/batchAnalysis.js`:
- Wraps Stockfish with a **persistent worker** (don't create/destroy per position like `stockfishAnalysis.js`)
- Exposes: `createBatchAnalyzer()` → `{ analyze(fen): Promise<result>, terminate() }`
- Reuses same worker across positions: just sends `position fen ...` + `go depth 14`
- Lower depth (14) for faster batch throughput

**Create** `frontend/src/contexts/BackgroundAnalysisContext.jsx`:
- Lives at App root, persists across page navigation
- Exposes: `{ queueGames(games), analysisProgress, isAnalyzing }`
- Flow:
  1. `queueGames(games)` called after successful fetch
  2. Creates ONE persistent batch analyzer
  3. For each game: parse PGN → list of FENs (using chess.js) → analyze each position → classify moves → accumulate results
  4. On game complete: `POST /games/{game_id}/analysis` with results array
  5. On failure: silently skip, move to next game
  6. On all done: terminate worker, clear queue

**Modify** `frontend/src/App.jsx` — wrap with `<BackgroundAnalysisProvider>`

**Modify** `frontend/src/pages/Games.jsx` — after successful fetch, call `queueGames(newGames)`. Show subtle progress indicator ("Analyzing 3/47 games...").

---

## Phase 5: Backend Trends Service

**Create** `backend/services/trends.py`:

| Function | Returns |
|----------|---------|
| `get_user_result(game, username)` | `"win"` / `"loss"` / `"draw"` |
| `compute_overview(games, username)` | `{total_games, wins, losses, draws, win_rate, latest_rating}` |
| `compute_results_over_time(games, username)` | `[{month, wins, losses, draws}, ...]` |
| `compute_rating_over_time(games, username)` | `[{end_time, rating, time_class}, ...]` |
| `compute_time_controls(games, username)` | `[{time_class, total, wins, losses, draws, win_rate}, ...]` |
| `compute_openings(games, username)` | Top 20: `[{opening, eco, total, wins, losses, draws, win_rate}, ...]` |
| `compute_accuracy(analyses, games, username)` | `[{month, avg_accuracy}, ...]` — derived from move classifications |
| `compute_blunder_frequency(analyses, games, username)` | `[{month, blunders, mistakes, inaccuracies}, ...]` |

**Opening extraction:** Regex `[Opening "..."]` and `[ECO "..."]` from PGN headers.

**Result mapping:** `"win"` = win; `"checkmated"/"resigned"/"timeout"/"abandoned"/"lose"` = loss; else draw.

**Accuracy formula:** Per game, `(good_moves + excellent_moves) / total_moves * 100`. Average per month.

---

## Phase 6: Backend Trends API

**Create** `backend/api/trends.py` — router with `prefix="/trends"`, all require auth.

| Endpoint | Query Params | Service Function |
|----------|-------------|-----------------|
| `GET /trends/overview` | `time_class?` | `compute_overview` |
| `GET /trends/results-over-time` | `time_class?` | `compute_results_over_time` |
| `GET /trends/rating` | `time_class?` | `compute_rating_over_time` |
| `GET /trends/time-controls` | — | `compute_time_controls` |
| `GET /trends/openings` | `time_class?` | `compute_openings` |
| `GET /trends/accuracy` | `time_class?` | `compute_accuracy` |
| `GET /trends/blunders` | `time_class?` | `compute_blunder_frequency` |

**Modify** `backend/db/repositories.py` — add `get_all_by_user_id(user_id, time_class=None)` (no limit).

**Modify** `backend/main.py` — register trends router.

---

## Phase 7: Frontend Service + Hook

**Modify** `frontend/src/services/trends.js` — replace stub with API call functions for all 7 endpoints.

**Create** `frontend/src/hooks/useTrends.js` — fetches all endpoints via `Promise.all`, manages loading/error, accepts `timeClass` filter.

---

## Phase 8: Frontend Chart Components

**Create** in `frontend/src/components/charts/`:

| Component | Chart Type | Data |
|-----------|-----------|------|
| `RatingChart.jsx` | recharts `LineChart` | Rating over time |
| `ResultsChart.jsx` | recharts stacked `BarChart` | Monthly W/L/D |
| `TimeControlChart.jsx` | recharts `PieChart` | Game distribution by time class |
| `OpeningsTable.jsx` | Styled table with win-rate bars | Top openings |
| `WinRateDonut.jsx` | recharts `PieChart` (donut) | Overall W/L/D |
| `AccuracyChart.jsx` | recharts `LineChart` | Monthly average accuracy |
| `BlunderChart.jsx` | recharts stacked `BarChart` | Monthly blunder/mistake/inaccuracy counts |

All use `ResponsiveContainer`, theme colors, `EmptyState` for empty data.

---

## Phase 9: Trends Page + Dashboard

**Modify** `frontend/src/pages/Trends.jsx`:
- Use `useTrends` hook
- Time class filter bar (All / Rapid / Blitz / Bullet)
- Layout: overview stats row → rating chart (full width) → 2-col grid with all other charts
- "Analyze unanalyzed games" button for retry (calls `queueGames` from BackgroundAnalysisContext)
- Accuracy and Blunder charts show "No analysis data yet" if no analysis exists

**Modify** `frontend/src/pages/Trends.css` — filter bar, stat row, chart container styles.

**Modify** `frontend/src/pages/Dashboard.jsx` — fetch overview on mount, populate stat tiles.

---

## Files Summary

| Action | File |
|--------|------|
| Modify | `backend/db/models.py` (add ratings + GameAnalysis model) |
| Create | Alembic migration (ratings + game_analysis table) |
| Modify | `backend/services/chess_com.py` (store ratings) |
| Modify | `backend/api/chess.py` (pass ratings on create + response) |
| Create | `backend/api/analysis.py` (analysis CRUD endpoints) |
| Create | `backend/services/trends.py` (all trend computations) |
| Create | `backend/api/trends.py` (7 trend endpoints) |
| Modify | `backend/db/repositories.py` (GameAnalysisRepo + get_all_by_user_id) |
| Modify | `backend/db/dependencies.py` (analysis repo DI) |
| Modify | `backend/main.py` (register routers) |
| Create | `frontend/src/engine/batchAnalysis.js` (persistent worker wrapper) |
| Create | `frontend/src/contexts/BackgroundAnalysisContext.jsx` |
| Modify | `frontend/src/App.jsx` (wrap with provider) |
| Modify | `frontend/src/pages/Games.jsx` (trigger background analysis) |
| Modify | `frontend/src/services/trends.js` |
| Create | `frontend/src/hooks/useTrends.js` |
| Create | `frontend/src/components/charts/RatingChart.jsx` |
| Create | `frontend/src/components/charts/ResultsChart.jsx` |
| Create | `frontend/src/components/charts/TimeControlChart.jsx` |
| Create | `frontend/src/components/charts/OpeningsTable.jsx` |
| Create | `frontend/src/components/charts/WinRateDonut.jsx` |
| Create | `frontend/src/components/charts/AccuracyChart.jsx` |
| Create | `frontend/src/components/charts/BlunderChart.jsx` |
| Modify | `frontend/src/pages/Trends.jsx` |
| Modify | `frontend/src/pages/Trends.css` |
| Modify | `frontend/src/pages/Dashboard.jsx` |

---

## Verification

1. `make migrate.upgrade` — confirm rating columns + game_analysis table exist
2. `POST /games/fetch` — verify new games have ratings stored
3. After fetch, observe browser console — background analysis starts, positions analyzed sequentially
4. `GET /games/{id}/analysis` — confirm analysis data saved after background analysis completes
5. `GET /trends/*` endpoints — confirm valid JSON responses
6. Frontend /trends — all charts render with real data
7. /dashboard — stat tiles show real numbers
8. Test with no games — empty states render cleanly
9. Test time_class filter — charts update correctly
10. Kill browser mid-analysis, reopen, go to Trends → "Analyze unanalyzed games" picks up remaining games
