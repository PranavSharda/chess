from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class PuzzleCandidateResponse(BaseModel):
    start_fen: str
    source_half_move_index: int
    played_move: str
    best_move: Optional[str] = None
    solution_uci: List[str] = Field(default_factory=list)
    cp: Optional[int] = None


class UserPuzzleResponse(BaseModel):
    puzzle_id: UUID
    game_id: UUID
    start_fen: str
    source_half_move_index: int
    played_move: str
    best_move: Optional[str] = None
    solution_uci: List[str] = Field(default_factory=list)
    cp: Optional[int] = None
    status: str
    raw_tags: List[str] = Field(default_factory=list)
    normalized_tags: List[str] = Field(default_factory=list)


class ListPuzzlesResponse(BaseModel):
    puzzles: List[UserPuzzleResponse]
    total: int


class ClassifyPuzzleResponse(BaseModel):
    puzzle_id: UUID
    game_id: UUID
    candidate: PuzzleCandidateResponse
    raw_tags: List[str] = Field(default_factory=list)
    normalized_tags: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)


class GeneratePuzzlesResponse(BaseModel):
    total: int
    generated: int
    skipped: int
    failed: int
    errors: List[str] = Field(default_factory=list)
