# Analysis Queue: Auto-analyze games via Stockfish WASM

## Context

Games fetched from Chess.com are stored but never batch-analyzed. The `is_analysed` and `analysed_game` fields exist in the DB but aren't exposed or used. The goal is to automatically queue unanalyzed games after fetch and run Stockfish WASM on every position, persisting results so analysis only happens once per game.

---

## Phase 1: Backend — Expose analysis fields + save endpoint [DONE]

- `GameResponse` uses `from_attributes = True`, flat fields matching ORM columns (no manual mapping)
- `AnalysedGame` request schema in `chess_request.py`
- `PATCH /games/{game_id}` endpoint with 404/403 separation
- `UserGameRepository.get_by_id` overridden for correct PK lookup, `BaseRepository.update` used for commit/refresh
- `is_analysed` column + Alembic migration
- REST naming: `/users/*`, `/games/import`

---

## Phase 2: Stockfish batch engine [DONE]

### 2a. Persistent worker session in `stockfishAnalysis.js`
- `createAnalysisSession()` → `{ analyze(fen) -> Promise, destroy() }`
- One worker reused across all positions in a game
- Existing `analyzePosition()` unchanged for interactive use

### 2b. `analyzeFullGame.js`
- Input: `pgn` string, `{ onProgress, signal }` options
- Parses PGN → FEN list via chess.js, analyzes each position sequentially
- Per move: `eval_before`, `eval_after`, `best_move`, `top_lines`, `cp_loss`, `classification`
- Classification: 0 = best, ≤20 = good, ≤50 = inaccuracy, ≤100 = mistake, >100 = blunder
- Accuracy formula: `max(0, 103.1668 * exp(-0.04354 * cpLoss) - 3.1668)` averaged per side
- Supports `AbortSignal` for cancellation
- Returns `{ moves: [...], summary: { white_accuracy, black_accuracy, *_blunders, *_mistakes, *_inaccuracies } }`

---

## Phase 3: Analysis Queue Context [DONE]

### 3a. `AnalysisQueueContext.jsx`
State: `queue[]`, `currentGame`, `currentMove`, `totalMoves`, `completedCount`, `totalQueued`, `isProcessing`, `error`

Methods:
- `enqueueGames(games)` — filters `is_analysed === false`, deduplicates via `seenIdsRef`, auto-starts processing
- `processNext()` — runs `analyzeFullGame`, PATCHes to backend via `saveGameAnalysis`, loops via `setTimeout`
- `pauseQueue()` — aborts current analysis, stops processing
- `resumeQueue()` — resumes from where it left off
- `cancelQueue()` — aborts, clears queue and all state

### 3b. Mounted in `App.jsx`
- `<AnalysisQueueProvider>` inside `ThemeProvider`, wrapping `<Router>`
- Persists across page navigation

### 3c. Auto-enqueue via `useGames` hook
- `saveGameAnalysis(gameId, data)` added to `services/games.js`
- `useGames` calls `enqueueGames(loaded)` after every successful `loadGames()`
- Triggers on initial load, manual fetch, and auto-fetch — fire-and-forget
- Nothing on the Games page depends on analysis success
- Failed games can be re-queued later during trend analysis

---

## Phase 4: Frontend UI integration [TODO]

### 4a. Analysis progress component
**New file: `frontend/src/components/ui/AnalysisProgress.jsx`**
- Compact bar: "Analyzing game X/Y — move M/N"
- Progress bar + pause/cancel buttons
- Render in Games page and optionally in AppShell header

### 4b. Game card analysis status
**File: `frontend/src/pages/Games.jsx`**
- Show analysis status badge per game card (checkmark if analyzed, spinner if in queue/processing)

### 4c. Use pre-computed analysis in GameAnalysis page
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
    "white_mistakes": 2, "black_mistakes": 4,
    "white_inaccuracies": 3, "black_inaccuracies": 5
  }
}
```

---

## Verification

1. Start backend + DB: `make dev`
2. Run migration: `make migrate.upgrade` (for `is_analysed` column)
3. Fetch games on Games page — confirm `is_analysed: false` appears in API response
4. Watch queue auto-start analyzing — check browser console for progress logs
5. After a game completes, verify `PATCH /games/{id}` succeeds (Network tab)
6. Refresh Games page — completed games show `is_analysed: true`
7. Navigate to an analyzed game — confirm pre-computed analysis renders without re-running Stockfish
