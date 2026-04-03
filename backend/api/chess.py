import logging
import math
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from cachetools import TTLCache
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import JSON

from core.auth import get_current_user
from db.models import User, UserGame
from db.repositories import UserGameRepository
from db.dependencies import get_user_game_repository
from schema import (
    FetchGamesRequest, GameResponse, ListGamesResponse, AnalysedGame,
    CommonMistake, CommonMistakesResponse, Timeframe,
)
from schema.chess_response import MistakeGame
from services.chess_com import fetch_chess_com_games

TIMEFRAME_MONTHS = {
    "3_months": 3,
    "1_year": 12,
    "5_years": 60,
    "10_years": 120,
}

OPENING_WC_THRESHOLD = 0.2
ENDGAME_WC_THRESHOLD = 0.2
OPENING_MAX_MOVE = 12
ENDGAME_LAST_HALF_MOVES = 40  # 20 full moves


def _cp_to_wc(cp: float) -> float:
    """Convert centipawns to winning chances [-1, 1] using Lichess sigmoid."""
    return 2.0 / (1.0 + math.exp(-0.00368208 * cp)) - 1.0


def _eval_to_wc(evaluation: dict) -> float:
    """Convert an eval dict {type, value} to winning chances."""
    if not evaluation:
        return 0.0
    if evaluation.get("type") == "mate":
        return 1.0 if evaluation.get("value", 0) > 0 else -1.0
    return _cp_to_wc(evaluation.get("value", 0))


def _timeframe_to_min_end_time(timeframe: Optional[str]) -> Optional[int]:
    """Convert a timeframe string to a minimum unix timestamp."""
    if not timeframe:
        return None
    months = TIMEFRAME_MONTHS.get(timeframe)
    if not months:
        return None
    now = datetime.now(timezone.utc)
    year = now.year
    month = now.month - months
    while month < 1:
        month += 12
        year -= 1
    day = min(now.day, 28)
    cutoff = datetime(year, month, day, tzinfo=timezone.utc)
    return int(cutoff.timestamp())

logger = logging.getLogger(__name__)

# Cache fetch results per (user_id, username, timeframe, game_types) for 5 min
_fetch_cache: TTLCache = TTLCache(maxsize=128, ttl=300)

router = APIRouter(tags=["games"])




@router.get("/games", response_model=ListGamesResponse)
def list_games(
    timeframe: Optional[str] = Query(None, description="Filter by timeframe: 3_months, 1_year, 5_years, 10_years"),
    time_class: Optional[str] = Query(None, description="Filter by time control: rapid, blitz, bullet"),
    current_user: User = Depends(get_current_user),
    user_game_repo: UserGameRepository = Depends(get_user_game_repository),
):
    """Return all stored games for the current user, optionally filtered by timeframe and time class."""
    min_end_time = _timeframe_to_min_end_time(timeframe)
    games = user_game_repo.get_by_user_id(current_user.id, limit=1000, min_end_time=min_end_time, time_class=time_class)
    return ListGamesResponse(
        games=[GameResponse.model_validate(g) for g in games],
        total=len(games),
    )


@router.get("/games/common-mistakes", response_model=CommonMistakesResponse)
def get_common_mistakes(
    timeframe: Optional[str] = Query(None, description="Filter by timeframe: 3_months, 1_year, 5_years, 10_years"),
    time_class: Optional[str] = Query(None, description="Filter by time control: rapid, blitz, bullet"),
    current_user: User = Depends(get_current_user),
    user_game_repo: UserGameRepository = Depends(get_user_game_repository),
):
    """Compute common opening and endgame mistakes from analysed games."""
    min_end_time = _timeframe_to_min_end_time(timeframe)
    games = user_game_repo.get_analysed_by_user_id(current_user.id, min_end_time=min_end_time, time_class=time_class)

    opening_map: dict[str, list] = defaultdict(list)
    endgame_map: dict[str, list] = defaultdict(list)

    for game in games:
        analysis = game.analysed_game
        if not analysis or "moves" not in analysis:
            continue

        moves = analysis["moves"]
        total_half_moves = len(moves)
        username = (game.chess_com_username or "").lower()
        user_side = "white" if (game.white_username or "").lower() == username else "black"

        for i, move in enumerate(moves):
            if move.get("side") != user_side:
                continue

            eval_before = move.get("eval_before")
            eval_after = move.get("eval_after")
            if not eval_before or not eval_after:
                continue

            wc_before = _eval_to_wc(eval_before)
            wc_after = _eval_to_wc(eval_after)
            wc_loss = (wc_before - wc_after) if user_side == "white" else (wc_after - wc_before)
            wc_loss = max(0.0, wc_loss)

            fen = move.get("fen_before")
            if not fen:
                continue

            entry = {
                "played_move": move.get("san", ""),
                "best_move": move.get("best_move", ""),
                "wc_loss": round(wc_loss, 3),
                "game_id": str(game.game_id),
                "half_move_index": i,
            }

            move_number = move.get("move_number", i // 2 + 1)
            if move_number <= OPENING_MAX_MOVE and wc_loss >= OPENING_WC_THRESHOLD:
                opening_map[fen].append(entry)

            if i >= total_half_moves - ENDGAME_LAST_HALF_MOVES and wc_loss >= ENDGAME_WC_THRESHOLD:
                endgame_map[fen].append(entry)

    def build_mistakes(mistake_map: dict[str, list]) -> list[CommonMistake]:
        results = []
        for fen, occurrences in mistake_map.items():
            if len(occurrences) < 2:
                continue
            most_common_move = Counter(o["played_move"] for o in occurrences).most_common(1)[0][0]
            matching = [o for o in occurrences if o["played_move"] == most_common_move]
            results.append(CommonMistake(
                fen=fen,
                played_move=most_common_move,
                best_move=matching[0]["best_move"] or None,
                avg_wc_loss=round(sum(o["wc_loss"] for o in matching) / len(matching), 3),
                count=len(matching),
                games=[
                    MistakeGame(game_id=UUID(o["game_id"]), half_move_index=o["half_move_index"])
                    for o in matching[:3]
                ],
            ))
        results.sort(key=lambda m: m.count, reverse=True)
        return results[:20]

    return CommonMistakesResponse(
        opening_mistakes=build_mistakes(opening_map),
        endgame_mistakes=build_mistakes(endgame_map),
        total_analysed=len(games),
    )


@router.get("/games/{game_id}", response_model=GameResponse)
def get_game(
    game_id: UUID,
    current_user: User = Depends(get_current_user),
    user_game_repo: UserGameRepository = Depends(get_user_game_repository),
):
    """Return a single game by ID, if it belongs to the current user."""
    game = user_game_repo.get_by_game_id(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    if game.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this game")
    return GameResponse.model_validate(game)

@router.patch("/games/{game_id}", response_model=GameResponse)
def patch_game(
        game_id: UUID,
        analysis_body: AnalysedGame,
        current_user: User = Depends(get_current_user),
        user_game_repo: UserGameRepository = Depends(get_user_game_repository),
):
    game = user_game_repo.get_by_game_id(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    if game.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this game")

    game = user_game_repo.update(
        game.game_id,
        analysed_game=analysis_body.analysed_game,
        white_accuracy=analysis_body.white_accuracy,
        black_accuracy=analysis_body.black_accuracy,
        user_blunder_count=analysis_body.user_blunder_count,
        is_analysed=True,
    )

    return GameResponse.model_validate(game)



@router.post("/games/import")
def fetch_games(
    request: FetchGamesRequest = FetchGamesRequest(),
    current_user: User = Depends(get_current_user),
    user_game_repo: UserGameRepository = Depends(get_user_game_repository),
):
    """Fetch games from Chess.com for the current user's linked username and store them."""
    username = (current_user.chess_com_username or "").strip()
    if not username:
        raise HTTPException(
            status_code=400,
            detail="Link a Chess.com username in your profile first",
        )
    username = username.lower()

    cache_key = (
        str(current_user.id),
        username,
        request.timeframe,
        tuple(sorted(request.game_types or [])),
    )
    if cache_key in _fetch_cache:
        return _fetch_cache[cache_key]

    raw_games = fetch_chess_com_games(
        username=username,
        timeframe=request.timeframe,
        game_types=request.game_types,
    )

    existing_uuids = user_game_repo.get_existing_chess_com_uuids(current_user.id)
    new_games = []
    for game in raw_games:
        ccuuid = game.chess_com_game_uuid
        if ccuuid and ccuuid in existing_uuids:
            continue
        new_games.append(dict(
            user_id=current_user.id,
            pgn=game.pgn,
            tcn=game.tcn,
            chess_com_username=game.chess_com_username or username,
            chess_com_game_uuid=ccuuid,
            end_time=game.end_time,
            time_class=game.time_class,
            time_control=game.time_control,
            white_username=game.white_username,
            black_username=game.black_username,
            white_result=game.white_result,
            black_result=game.black_result,
            white_rating=game.white_rating,
            black_rating=game.black_rating,
        ))
    if new_games:
        user_game_repo.bulk_create(new_games)
    added = len(new_games)

    result = {
        "fetched": len(raw_games),
        "added": added,
        "message": f"Added {added} new games (total fetched: {len(raw_games)}).",
    }
    _fetch_cache[cache_key] = result
    return result
