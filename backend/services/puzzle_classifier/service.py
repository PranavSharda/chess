from chess import Board, Move
from chess.pgn import Game

from .cook import cook
from .model import Puzzle


def classify_puzzle_candidate(
    *,
    puzzle_id: str,
    start_fen: str,
    solution_uci: list[str],
    cp: int | None,
) -> list[str]:
    if not solution_uci:
        return []

    board = Board(start_fen)
    node = Game.from_board(board)

    for uci in solution_uci:
        move = Move.from_uci(uci)
        if move not in node.board().legal_moves:
            raise ValueError(f"Illegal puzzle line move: {uci}")
        node = node.add_main_variation(move)

    puzzle = Puzzle(id=puzzle_id, game=node.game(), cp=int(cp or 0))
    return list(dict.fromkeys(cook(puzzle)))
