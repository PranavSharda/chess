from enum import Enum
from typing import List

from typing import Any
from pydantic import BaseModel, Field


class Timeframe(str, Enum):
    THREE_MONTHS = "3_months"
    ONE_YEAR = "1_year"
    FIVE_YEARS = "5_years"
    TEN_YEARS = "10_years"


class GameType(str, Enum):
    RAPID = "rapid"
    BLITZ = "blitz"
    BULLET = "bullet"


class FetchGamesRequest(BaseModel):
    timeframe: Timeframe = Field(
        default=Timeframe.THREE_MONTHS,
        description="How far back to fetch games",
    )
    game_types: List[GameType] = Field(
        default=[GameType.RAPID, GameType.BLITZ, GameType.BULLET],
        description="Filter by game types",
    )


class AnalysedGame(BaseModel):
    analysed_game: dict[str, Any] = Field(description="Full Stockfish analysis output for the game")
    white_accuracy: float = Field(description="White's overall accuracy percentage")
    black_accuracy: float = Field(description="Black's overall accuracy percentage")
    user_blunder_count: float = Field(description="Number of blunders made by the user")
