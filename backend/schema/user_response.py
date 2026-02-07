from typing import Optional

from pydantic import BaseModel


class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    lichess_id: Optional[str] = None
    chess_com_username: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
