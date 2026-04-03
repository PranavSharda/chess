# Common Mistakes — Technical Documentation

## Overview
The Common Mistakes page replaces the old Trends page. It identifies positions where the user repeatedly makes errors in openings and endgames, using winning-chances-based thresholds derived from the Lichess source code.

---

## Winning Chances Model

All move quality evaluation uses a **sigmoid function** to convert centipawn evaluations to winning chances on a [-1, 1] scale:

```
wc(cp) = 2 / (1 + exp(-0.00368208 * cp)) - 1
```

- The constant `0.00368208` was empirically derived from Lichess game data ([lila PR #11148](https://github.com/lichess-org/lila/pull/11148))
- Source: [`modules/analyse/src/main/WinPercent.scala`](https://github.com/lichess-org/lila/blob/master/modules/analyse/src/main/WinPercent.scala)
- Mate evaluations map to `+1.0` (winning) or `-1.0` (losing)

**Why winning chances instead of raw centipawns?**
Losing 50cp in an equal position (wc_loss ~0.07) is much more significant than losing 50cp when already up 8 pawns (wc_loss ~0.001). The sigmoid naturally weights mistakes by how much they actually affect the game outcome.

### Reference: cp → winning chances mapping

| Centipawns | Win Chances | Win % |
|------------|-------------|-------|
| 0          | 0.000       | 50.0% |
| 50         | 0.091       | 54.6% |
| 100        | 0.181       | 59.0% |
| 200        | 0.349       | 67.5% |
| 300        | 0.498       | 74.9% |
| 500        | 0.724       | 86.2% |
| 1000       | 0.947       | 97.4% |

---

## Move Classification Thresholds

Used in `frontend/src/engine/analyzeFullGame.js` for per-move classification (consistent with Lichess [`modules/tree/src/main/Advice.scala`](https://github.com/lichess-org/lila/blob/master/modules/tree/src/main/Advice.scala)):

| Classification | Winning Chances Loss |
|----------------|---------------------|
| Best           | <= 0                |
| Good           | < 0.1               |
| Inaccuracy     | >= 0.1              |
| Mistake        | >= 0.2              |
| Blunder        | >= 0.3              |

---

## Common Mistakes Detection

### Thresholds

| Phase    | Scope                            | wc_loss Threshold | Rough cp Equivalent (from equal) |
|----------|----------------------------------|-------------------|----------------------------------|
| Opening  | User's moves 1–12               | >= 0.2            | ~110 cp                          |
| Endgame  | User's last 20 full moves (40 half-moves) | >= 0.5  | ~300 cp                          |

### Computation (`GET /games/common-mistakes`)

**wc_loss calculation per move:**
```python
wc_before = sigmoid(eval_before)     # from moving side's perspective
wc_after  = sigmoid(eval_after)
wc_loss   = max(0, wc_before - wc_after)   # white's perspective
# For black: max(0, wc_after - wc_before)  # flipped since evals are from white's POV
```

**Grouping logic:**
1. Collect all qualifying mistakes across all analysed games in the timeframe
2. Group by `fen_before` (exact FEN including move counters)
3. Within each FEN group, sub-group by `played_move` (SAN), take the most frequent
4. Filter: require **>= 2 occurrences** to qualify as a "common" mistake
5. Sort by occurrence count descending
6. Cap at **20 results** per category (opening / endgame)

**Side detection:** Compare game's `chess_com_username` against `white_username` / `black_username` to determine which moves are the user's.

### Known Limitations
- **FEN includes move counters**: Two identical board positions with different halfmove/fullmove clocks won't group together. Acceptable for v1.
- **Endgame heuristic**: "Last 20 moves" is index-based, not material-based. Short games may include middlegame positions.
- **Analysis depth**: Stockfish WASM at depth 16, MultiPV 1 — less accurate than server-side deep analysis.

---

## Move Accuracy Formula

Used in `analyzeFullGame.js` for per-move accuracy percentage (independent of the classification system):

```
accuracy(cpLoss) = max(0, 103.1668 * exp(-0.04354 * |cpLoss|) - 3.1668)
```

Returns 0–100. This is a separate formula from the winning chances model and uses raw centipawn loss.

---

## API

### `GET /games/common-mistakes`

| Param     | Type   | Required | Description |
|-----------|--------|----------|-------------|
| timeframe | string | No       | `3_months`, `1_year`, `5_years`, `10_years`. Omit for all time. |

**Response** (`CommonMistakesResponse`):
```json
{
  "opening_mistakes": [
    {
      "fen": "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2",
      "played_move": "Nc6",
      "best_move": "d6",
      "avg_wc_loss": 0.231,
      "count": 4,
      "example_game_ids": ["uuid1", "uuid2", "uuid3"]
    }
  ],
  "endgame_mistakes": [],
  "total_analysed": 47
}
```

### `GET /games`

| Param     | Type   | Required | Description |
|-----------|--------|----------|-------------|
| timeframe | string | No       | Filters by `end_time >= now - timeframe`. Omit for all games. |

---

## User Flow

```
User selects timeframe
        │
        ▼
POST /games/import (timeframe)
  → Fetch from Chess.com
  → Deduplicate by chess_com_game_uuid
  → Store new games
        │
        ▼
GET /games?timeframe=X
  → Return games in window
  → Frontend checks is_analysed
        │
        ▼
  ┌─ All analysed? ──── Yes ──┐
  │                            │
  No                           │
  │                            │
  ▼                            ▼
Enqueue in AnalysisQueue    GET /games/common-mistakes?timeframe=X
  → Stockfish WASM depth 16    → Backend computes wc_loss
  → PATCH /games/{id}          → Groups by FEN + played_move
  → Progress bar shown         → Returns top 20 per category
  │                            │
  └──── When done ─────────────┘
                               │
                               ▼
                        Render results
                    (mini boards + move info)
```

---

## Files

| File | What changed |
|------|-------------|
| `backend/api/chess.py` | New `GET /games/common-mistakes` endpoint; `timeframe` param on `GET /games` |
| `backend/schema/chess_response.py` | `CommonMistake`, `CommonMistakesResponse` models |
| `backend/schema/__init__.py` | Exports for new models |
| `backend/db/repositories.py` | `get_analysed_by_user_id()`, `min_end_time` on `get_by_user_id()` |
| `frontend/src/services/games.js` | `fetchCommonMistakes()`, timeframe param on `fetchGames()` |
| `frontend/src/hooks/useTrends.js` | Full rewrite — orchestrates import → analyse → compute flow |
| `frontend/src/pages/Trends.jsx` | Full rewrite — timeframe selector, progress states, MistakeCard grid |
| `frontend/src/pages/Trends.css` | Full rewrite — progress bar, mistake cards, responsive layout |
| `frontend/src/engine/analyzeFullGame.js` | Winning-chances-based move classification (separate change) |
