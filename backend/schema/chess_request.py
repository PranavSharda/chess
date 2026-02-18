from typing import List, Literal

from pydantic import BaseModel, Field


class FetchGamesRequest(BaseModel):
    timeframe: Literal["3_months", "1_year", "5_years", "10_years"] = Field(
        default="3_months",
        description="How far back to fetch games",
    )
    game_types: List[Literal["rapid", "blitz", "bullet"]] = Field(
        default=["rapid", "blitz", "bullet"],
        description="Filter by game types",
    )
