import logging
import sys
from uuid import UUID

from cachetools import TTLCache
from fastapi import APIRouter, Depends, HTTPException

from core.auth import get_current_user
from db.models import User, UserGame
from db.repositories import UserGameRepository
from db.dependencies import get_user_game_repository
from schema import FetchGamesRequest
from services.chess_com import fetch_chess_com_games

logger = logging.getLogger(__name__)

# Cache fetch results per (user_id, username, timeframe, game_types) for 5 min
_fetch_cache: TTLCache = TTLCache(maxsize=128, ttl=300)

router = APIRouter(prefix="/games", tags=["games"])


def _game_to_response(g: UserGame) -> dict:
    """Shape a UserGame for the frontend."""
    return {
        "game_id": str(g.game_id),
        "uuid": g.chess_com_game_uuid or str(g.game_id),
        "pgn": g.pgn,
        "tcn": g.tcn,
        "chess_com_username": g.chess_com_username,
        "end_time": g.end_time,
        "time_control": g.time_control or g.time_class,
        "time_class": g.time_class,
        "white": {"username": g.white_username, "result": g.white_result} if g.white_username else {},
        "black": {"username": g.black_username, "result": g.black_result} if g.black_username else {},
    }


@router.get("")
def list_games(
    current_user: User = Depends(get_current_user),
    user_game_repo: UserGameRepository = Depends(get_user_game_repository),
):
    """Return all stored games for the current user."""
    games = user_game_repo.get_by_user_id(current_user.id, limit=1000)
    total = user_game_repo.count_by_user_id(current_user.id)
    return {
        "games": [_game_to_response(g) for g in games],
        "total": total,
    }


@router.get("/{game_id}")
def get_game(
    game_id: UUID,
    current_user: User = Depends(get_current_user),
    user_game_repo: UserGameRepository = Depends(get_user_game_repository),
):
    """Return a single game by ID, if it belongs to the current user."""
    game = user_game_repo.get_by_game_id(game_id)
    if not game or game.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Game not found")
    return _game_to_response(game)


@router.post("/fetch")
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
    added = 0
    for g in raw_games:
        ccuuid = g.get("chess_com_game_uuid")
        if ccuuid and ccuuid in existing_uuids:
            continue
        user_game_repo.create(
            user_id=current_user.id,
            pgn=g.get("pgn") or "",
            tcn=g.get("tcn"),
            chess_com_username=g.get("chess_com_username") or username,
            chess_com_game_uuid=ccuuid,
            end_time=g.get("end_time"),
            time_class=g.get("time_class"),
            time_control=g.get("time_control"),
            white_username=g.get("white_username"),
            black_username=g.get("black_username"),
            white_result=g.get("white_result"),
            black_result=g.get("black_result"),
        )
        added += 1

    result = {
        "fetched": len(raw_games),
        "added": added,
        "message": f"Added {added} new games (total fetched: {len(raw_games)}).",
    }
    _fetch_cache[cache_key] = result
    return result
