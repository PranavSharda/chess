# Analysis Queue: Auto-analyze games via Stockfish WASM

## Context

Games fetched from Chess.com are stored but never batch-analyzed. The `is_analysed` and `analysed_game` fields exist in the DB but aren't exposed or used. The goal is to automatically queue unanalyzed games after fetch and run Stockfish WASM on every position, persisting results so analysis only happens once per game.

---

## Phase 1: Backend — Expose analysis fields + save endpoint

### 1a. Update `GameResponse` schema
**File: `backend/schema/chess_response.py`**
- Add to `GameResponse`: `is_analysed: bool = False`, `white_accuracy: Optional[float]`, `black_accuracy: Optional[float]`, `user_blunder_count: Optional[int]`
- Create new `SaveAnalysisRequest` schema: `analysed_game: dict`, `white_accuracy: float`, `black_accuracy: float`, `user_blunder_count: int`
- Create `GameDetailResponse(GameResponse)` that adds `analysed_game: Optional[dict]` — used only on single-game GET to avoid huge list payloads

### 1b. Update `_game_to_response` and add detail variant
**File: `backend/api/chess.py`**
- Add `is_analysed`, `white_accuracy`, `black_accuracy`, `user_blunder_count` to `_game_to_response`
- Create `_game_to_detail_response` that also includes `analysed_game` — used by `GET /games/{game_id}`

### 1c. Add `PATCH /games/{game_id}/analysis` endpoint
**File: `backend/api/chess.py`**
- Auth required, verify `game.user_id == current_user.id`
- Accept `SaveAnalysisRequest` body
- Call repo method to persist + set `is_analysed = True`

### 1d. Add `update_analysis` repository method
**File: `backend/db/repositories.py`**
- Can't use `BaseRepository.update` (it looks up by `self.model.id` but PK is `game_id`)
- Direct update: set `analysed_game`, `white_accuracy`, `black_accuracy`, `user_blunder_count`, `is_analysed = True`, commit

---

## Phase 2: Stockfish batch engine

### 2a. Add persistent worker session to `stockfishAnalysis.js`
**File: `frontend/src/engine/stockfishAnalysis.js`**
- Current `analyzePosition` creates/destroys a worker per call — too expensive for 40+ positions per game
- Add `createAnalysisSession()` returning `{ analyze(fen) -> Promise, destroy() }` that reuses one worker across all positions
- Existing `analyzePosition` stays unchanged for interactive use

### 2b. Create `analyzeFullGame.js`
**New file: `frontend/src/engine/analyzeFullGame.js`**
- Input: `pgn` string, `onProgress(moveIndex, totalMoves)` callback
- Uses `chess.js` to parse PGN into list of positions (FENs)
- Creates one analysis session, analyzes each position sequentially
- For each move: records `eval_before`, `eval_after`, `best_move`, `top_lines`, computes `cp_loss` and `classification`
- Classification thresholds: 0 = best, <20 = good, 20-50 = inaccuracy, 50-100 = mistake, 100+ = blunder
- Computes `white_accuracy`, `black_accuracy` using centipawn-loss formula: `max(0, 103.1668 * exp(-0.04354 * cpLoss) - 3.1668)` averaged per side
- Computes blunder counts per side
- Returns `{ moves: [...], summary: { white_accuracy, black_accuracy, white_blunders, black_blunders, ... } }`

---

## Phase 3: Analysis Queue Context

### 3a. Create `AnalysisQueueContext.jsx`
**New file: `frontend/src/contexts/AnalysisQueueContext.jsx`**

State: `queue[]`, `currentGame`, `currentMove`, `totalMoves`, `completedCount`, `totalQueued`, `isProcessing`, `error`

Key methods:
- `enqueueGames(games)` — filters to `is_analysed === false`, deduplicates against already-queued/completed, starts processing
- `processNext()` — pops next game, runs `analyzeFullGame`, calls `PATCH /games/{id}/analysis`, loops
- `pauseQueue()` / `resumeQueue()` / `cancelQueue()`

### 3b. Mount provider in App.jsx
**File: `frontend/src/App.jsx`**
- Wrap `<Router>` with `<AnalysisQueueProvider>` inside `AuthProvider`/`ThemeProvider`
- Persists across page navigation — analysis continues in background as user browses

---

## Phase 4: Frontend API + UI integration

### 4a. Add `saveGameAnalysis` to games service
**File: `frontend/src/services/games.js`**
- `saveGameAnalysis(gameId, data)` → `api.patch(/games/${gameId}/analysis, data)`

### 4b. Trigger queue from Games page
**File: `frontend/src/pages/Games.jsx`**
- After `loadGames()` or fetch completes, call `enqueueGames(allGames)`
- Show analysis status badge per game card (checkmark if analyzed, spinner if in queue/processing)

### 4c. Analysis progress component
**New file: `frontend/src/components/ui/AnalysisProgress.jsx`**
- Compact bar: "Analyzing game X/Y — move M/N"
- Progress bar + pause/cancel buttons
- Render in Games page and optionally in AppShell header

### 4d. Use pre-computed analysis in GameAnalysis page
**File: `frontend/src/pages/GameAnalysis.jsx`**
- When `is_analysed === true`, display stored move classifications, accuracy scores, blunder highlights
- Still allow live Stockfish for interactive exploration of side lines

---

## `analysed_game` JSON structure

```json
{
  "moves": [
    {
      "move_number": 1, "side": "white", "san": "e4", "uci": "e2e4",
      "fen_before": "...", "fen_after": "...",
      "eval_before": { "type": "cp", "value": 20 },
      "eval_after": { "type": "cp", "value": 18 },
      "best_move": "e2e4", "top_lines": [...],
      "cp_loss": 0, "classification": "best"
    }
  ],
  "summary": {
    "white_accuracy": 87.3, "black_accuracy": 72.1,
    "white_blunders": 1, "black_blunders": 3,
    "white_mistakes": 2, "black_mistakes": 4
  }
}
```

---

## Implementation order

1. **Backend** (Phase 1) — no frontend dependency, unblocks everything
2. **Batch engine** (Phase 2) — pure logic, testable standalone
3. **Queue context** (Phase 3) — depends on Phase 2 + service from 4a
4. **UI integration** (Phase 4) — depends on all above

## Verification

1. Start backend + DB: `make dev`
2. Run migration: `make migrate.upgrade` (for `is_analysed` column)
3. Fetch games on Games page — confirm `is_analysed: false` appears in API response
4. Watch queue auto-start analyzing — check browser console for progress logs
5. After a game completes, verify `PATCH /games/{id}/analysis` succeeds (Network tab)
6. Refresh Games page — completed games show `is_analysed: true`
7. Navigate to an analyzed game — confirm pre-computed analysis renders without re-running Stockfish
