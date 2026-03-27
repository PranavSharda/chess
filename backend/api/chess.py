import logging
import sys
from uuid import UUID

from cachetools import TTLCache
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import JSON

from core.auth import get_current_user
from db.models import User, UserGame
from db.repositories import UserGameRepository
from db.dependencies import get_user_game_repository
from schema import FetchGamesRequest, GameResponse, ListGamesResponse, AnalysedGame
from services.chess_com import fetch_chess_com_games

logger = logging.getLogger(__name__)

# Cache fetch results per (user_id, username, timeframe, game_types) for 5 min
_fetch_cache: TTLCache = TTLCache(maxsize=128, ttl=300)

router = APIRouter(tags=["games"])




@router.get("/games", response_model=ListGamesResponse)
def list_games(
    current_user: User = Depends(get_current_user),
    user_game_repo: UserGameRepository = Depends(get_user_game_repository),
):
    """Return all stored games for the current user."""
    games = user_game_repo.get_by_user_id(current_user.id, limit=1000)
    total = user_game_repo.count_by_user_id(current_user.id)
    return ListGamesResponse(
        games=[GameResponse.model_validate(g) for g in games],
        total=total,
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
    added = 0
    for game in raw_games:
        ccuuid = game.chess_com_game_uuid
        if ccuuid and ccuuid in existing_uuids:
            continue
        user_game_repo.create(
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
        )
        added += 1

    result = {
        "fetched": len(raw_games),
        "added": added,
        "message": f"Added {added} new games (total fetched: {len(raw_games)}).",
    }
    _fetch_cache[cache_key] = result
    return result
