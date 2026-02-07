from fastapi import APIRouter, HTTPException, status
import chess.pgn as pgn
import stockfish
import io
import os

router = APIRouter()

@router.get('/games')
def get_games(user_id: str):
    """Return all games for a user."""
    return {
        "games": games
    }
    
@router.get('/analysis')
def get_analysis(chess_pgn: str):
    """Return evaluation of the game, top 3 lines, and the best move."""
    if not chess_pgn or not chess_pgn.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="chess_pgn is required"
        )

    try:
        game = pgn.read_game(io.StringIO(chess_pgn))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid PGN format"
        )

    if game is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid PGN format"
        )

    board = game.end().board()
    engine_path = os.getenv("STOCKFISH_PATH", "stockfish")

    try:
        engine = stockfish.Stockfish(engine_path)
        engine.set_fen_position(board.fen())
        evaluation = engine.get_evaluation()
        best_move = engine.get_best_move()
        top_lines = engine.get_top_moves(3)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stockfish engine is unavailable"
        )

    return {
        "evaluation": evaluation,
        "top_lines": top_lines,
        "best_move": best_move
    }