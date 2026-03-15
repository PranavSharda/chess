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


class GamePlayer(BaseModel):
    username: str
    result: str
    rating: Optional[int] = None


class GameResponse(BaseModel):
    game_id: str
    uuid: str
    pgn: str
    tcn: Optional[str] = None
    chess_com_username: str
    end_time: Optional[int] = None
    time_control: str
    time_class: str
    white: Optional[GamePlayer] = None
    black: Optional[GamePlayer] = None


class ListGamesResponse(BaseModel):
    games: List[GameResponse]
    total: int
