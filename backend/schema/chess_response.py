from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class ChessComPlayer(BaseModel):
    username: str
    result: str
    rating: Optional[int] = None
    # We allow extra fields since the API might return more like @id, uuid, etc.
    class Config:
        extra = "allow"


class ChessComGame(BaseModel):
    pgn: str
    tcn: Optional[str] = None
    chess_com_username: str
    chess_com_game_uuid: Optional[str] = None
    end_time: Optional[int] = None
    time_class: str
    white_username: Optional[str] = None
    black_username: Optional[str] = None
    white_result: Optional[str] = None
    black_result: Optional[str] = None
    time_control: Optional[str] = None
    white: Dict[str, Any]
    black: Dict[str, Any]
    uuid: Optional[str] = None
    white_rating: Optional[int] = None
    black_rating: Optional[int] = None


class GameResponse(BaseModel):
    model_config = {"from_attributes": True}

    game_id: str
    pgn: str
    tcn: Optional[str] = None
    chess_com_username: str
    chess_com_game_uuid: Optional[str] = None
    end_time: Optional[int] = None
    time_control: Optional[str] = None
    time_class: Optional[str] = None
    white_username: Optional[str] = None
    black_username: Optional[str] = None
    white_result: Optional[str] = None
    black_result: Optional[str] = None
    white_rating: Optional[int] = None
    black_rating: Optional[int] = None
    white_accuracy: Optional[float] = None
    black_accuracy: Optional[float] = None
    user_blunder_count: Optional[int] = None
    is_analysed: bool = False


class ListGamesResponse(BaseModel):
    games: List[GameResponse]
    total: int
