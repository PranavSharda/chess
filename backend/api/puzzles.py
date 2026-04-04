from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query

from core.auth import get_current_user
from db.dependencies import get_user_game_repository, get_user_puzzle_repository
from db.models import User, UserGame, UserPuzzle
from db.repositories import UserGameRepository, UserPuzzleRepository
from schema import (
    ClassifyPuzzleResponse,
    GeneratePuzzlesResponse,
    ListPuzzlesResponse,
    PuzzleCandidateResponse,
    UserPuzzleResponse,
)
from services.puzzle_candidates import extract_puzzle_candidate
from services.puzzle_classifier import classify_puzzle_candidate


router = APIRouter(tags=["puzzles"])


def _serialize_user_puzzle(puzzle) -> UserPuzzleResponse:
    return UserPuzzleResponse(
        puzzle_id=puzzle.puzzle_id,
        game_id=puzzle.game_id,
        start_fen=puzzle.start_fen,
        source_half_move_index=puzzle.source_half_move_index,
        played_move=puzzle.played_move,
        best_move=puzzle.best_move,
        solution_uci=puzzle.solution_uci or [],
        cp=puzzle.cp,
        status=puzzle.status,
        raw_tags=puzzle.raw_tags or [],
        normalized_tags=puzzle.normalized_tags or [],
    )


def _classify_and_store_puzzle(
    game: UserGame,
    *,
    current_user: User,
    user_puzzle_repo: UserPuzzleRepository,
) -> UserPuzzle:
    candidate = extract_puzzle_candidate(game)

    existing = user_puzzle_repo.get_existing_candidate(
        current_user.id,
        game.game_id,
        candidate.source_half_move_index,
    )

    puzzle_ref = (
        str(existing.puzzle_id)
        if existing
        else f"{game.game_id}:{candidate.source_half_move_index}"
    )
    raw_tags = classify_puzzle_candidate(
        puzzle_id=puzzle_ref,
        start_fen=candidate.start_fen,
        solution_uci=candidate.solution_uci,
        cp=candidate.cp,
    )

    payload = {
        "user_id": current_user.id,
        "game_id": game.game_id,
        "start_fen": candidate.start_fen,
        "source_half_move_index": candidate.source_half_move_index,
        "played_move": candidate.played_move,
        "best_move": candidate.best_move,
        "solution_uci": candidate.solution_uci,
        "cp": candidate.cp,
        "raw_tags": raw_tags,
        "normalized_tags": [],
        "candidate_score": candidate.candidate_score,
        "status": "classified",
    }

    return (
        user_puzzle_repo.update(existing.puzzle_id, **payload)
        if existing
        else user_puzzle_repo.create(**payload)
    )


def _build_classify_response(game: UserGame, puzzle: UserPuzzle) -> ClassifyPuzzleResponse:
    return ClassifyPuzzleResponse(
        puzzle_id=puzzle.puzzle_id,
        game_id=game.game_id,
        candidate=PuzzleCandidateResponse(
            start_fen=puzzle.start_fen,
            source_half_move_index=puzzle.source_half_move_index,
            played_move=puzzle.played_move,
            best_move=puzzle.best_move,
            solution_uci=puzzle.solution_uci or [],
            cp=puzzle.cp,
        ),
        raw_tags=puzzle.raw_tags or [],
        normalized_tags=puzzle.normalized_tags or [],
        warnings=[],
    )


@router.get("/puzzles", response_model=ListPuzzlesResponse)
def list_puzzles(
    status: str | None = Query(None, description="Optional status filter"),
    current_user: User = Depends(get_current_user),
    user_puzzle_repo: UserPuzzleRepository = Depends(get_user_puzzle_repository),
):
    puzzles = user_puzzle_repo.get_by_user_id(current_user.id, limit=500, status=status)
    return ListPuzzlesResponse(
        puzzles=[_serialize_user_puzzle(p) for p in puzzles],
        total=len(puzzles),
    )


@router.post("/puzzles/generate", response_model=GeneratePuzzlesResponse)
def generate_puzzles(
    current_user: User = Depends(get_current_user),
    user_game_repo: UserGameRepository = Depends(get_user_game_repository),
    user_puzzle_repo: UserPuzzleRepository = Depends(get_user_puzzle_repository),
):
    games = user_game_repo.get_analysed_by_user_id(current_user.id)
    generated = 0
    skipped = 0
    failed = 0
    errors: list[str] = []

    for game in games:
        try:
            _classify_and_store_puzzle(
                game,
                current_user=current_user,
                user_puzzle_repo=user_puzzle_repo,
            )
            generated += 1
        except ValueError as exc:
            skipped += 1
            errors.append(f"{game.game_id}: {exc}")
        except Exception as exc:
            failed += 1
            errors.append(f"{game.game_id}: {exc}")

    return GeneratePuzzlesResponse(
        total=len(games),
        generated=generated,
        skipped=skipped,
        failed=failed,
        errors=errors[:20],
    )


@router.get("/puzzles/{puzzle_id}", response_model=UserPuzzleResponse)
def get_puzzle(
    puzzle_id: UUID,
    current_user: User = Depends(get_current_user),
    user_puzzle_repo: UserPuzzleRepository = Depends(get_user_puzzle_repository),
):
    puzzle = user_puzzle_repo.get_by_puzzle_id(puzzle_id)
    if not puzzle:
        raise HTTPException(status_code=404, detail="Puzzle not found")
    if puzzle.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this puzzle")
    return _serialize_user_puzzle(puzzle)


@router.post("/games/{game_id}/classify-puzzle", response_model=ClassifyPuzzleResponse)
def classify_game_puzzle(
    game_id: UUID,
    current_user: User = Depends(get_current_user),
    user_game_repo: UserGameRepository = Depends(get_user_game_repository),
    user_puzzle_repo: UserPuzzleRepository = Depends(get_user_puzzle_repository),
):
    game = user_game_repo.get_by_game_id(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    if game.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this game")
    if not game.is_analysed or not game.analysed_game:
        raise HTTPException(status_code=400, detail="Game must be analyzed before classification")

    try:
        puzzle = _classify_and_store_puzzle(
            game,
            current_user=current_user,
            user_puzzle_repo=user_puzzle_repo,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    return _build_classify_response(game, puzzle)
