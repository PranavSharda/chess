from dataclasses import dataclass
from typing import Optional

from chess import Board, Move

from db.models import UserGame


MISTAKE_PRIORITY = {
    "blunder": 2,
    "mistake": 1,
}

# The solver must end up with at least this much advantage (centipawns)
# for the position to qualify as a puzzle candidate.
MIN_ADVANTAGE_CP = 150


@dataclass
class PuzzleCandidate:
    start_fen: str
    source_half_move_index: int
    played_move: str
    best_move: Optional[str]
    solution_uci: list[str]
    cp: Optional[int]
    candidate_score: float


def _user_side(game: UserGame) -> str:
    username = (game.chess_com_username or "").lower()
    if (game.white_username or "").lower() == username:
        return "white"
    if (game.black_username or "").lower() == username:
        return "black"
    raise ValueError("Unable to determine the user's side for this game")


def _eval_cp(eval_dict: Optional[dict], perspective: str) -> Optional[int]:
    """Convert an evaluation dict to centipawns from `perspective`'s point of view."""
    if not eval_dict:
        return None

    if eval_dict.get("type") == "mate":
        white_cp = 10000 if eval_dict.get("value", 0) > 0 else -10000
    else:
        white_cp = int(eval_dict.get("value", 0))

    return white_cp if perspective == "white" else -white_cp


def _solution_line(moves: list[dict], index: int) -> list[str]:
    """Get the engine's best continuation from the position after move at `index`.

    `moves[index+1].top_lines` / `best_move` are the engine's evaluation of the
    position *before* `moves[index+1]` is played — which is the position *after*
    the move at `index`.
    """
    if index + 1 >= len(moves):
        return []

    next_move = moves[index + 1]
    top_lines = next_move.get("top_lines") or []
    if top_lines:
        line = (top_lines[0] or {}).get("Line", "")
        if line:
            return [uci for uci in line.split() if uci]

    best_reply = next_move.get("best_move")
    return [best_reply] if best_reply else []


def _uci_to_san(fen: str, uci: Optional[str]) -> Optional[str]:
    if not fen or not uci:
        return uci

    try:
        board = Board(fen)
        move = Move.from_uci(uci)
        return board.san(move)
    except ValueError:
        return uci


def extract_puzzle_candidate(game: UserGame) -> PuzzleCandidate:
    """Extract a puzzle from an opponent's blunder in one of the user's games.

    Standard puzzle flow:
      1. The opponent makes a blunder (auto-played on the board).
      2. The user (solver) must find the best punishment continuation.

    This matches the Lichess / Chess.com puzzle format where you punish the
    other side's mistake, playing as yourself.
    """
    analysis = game.analysed_game or {}
    moves = analysis.get("moves") or []
    if not moves:
        raise ValueError("Game has no analyzed move data")

    user_side = _user_side(game)
    opponent_side = "black" if user_side == "white" else "white"
    best_candidate: Optional[PuzzleCandidate] = None
    best_sort_key: Optional[tuple[int, float, int]] = None

    for i, move in enumerate(moves):
        # Look at the OPPONENT's moves for blunders / mistakes
        if move.get("side") != opponent_side:
            continue

        classification = (move.get("classification") or "").lower()
        priority = MISTAKE_PRIORITY.get(classification)
        if not priority:
            continue

        fen_before = move.get("fen_before")
        played_uci = move.get("uci")
        if not fen_before or not played_uci:
            continue

        continuation = _solution_line(moves, i)
        if not continuation:
            continue

        # Eval from the user's perspective after the opponent's blunder.
        # Must show a clear advantage for the user to be a valid puzzle.
        cp = _eval_cp(move.get("eval_after"), user_side)
        if cp is not None and cp < MIN_ADVANTAGE_CP:
            continue

        cp_loss = float(move.get("cp_loss") or 0)

        # Build SAN representations for display context
        played_san = move.get("san") or played_uci
        best_san = _uci_to_san(fen_before, move.get("best_move"))

        candidate = PuzzleCandidate(
            start_fen=fen_before,
            source_half_move_index=i,
            played_move=played_san,
            best_move=best_san,
            solution_uci=[played_uci, *continuation],
            cp=cp,
            candidate_score=cp_loss,
        )

        sort_key = (priority, cp_loss, -i)
        if best_sort_key is None or sort_key > best_sort_key:
            best_sort_key = sort_key
            best_candidate = candidate

    if not best_candidate:
        raise ValueError("No tactical puzzle candidate found in this game")

    return best_candidate
