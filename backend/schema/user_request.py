from typing import Optional
from pydantic import BaseModel 


class SignUpRequest(BaseModel):
    username: str
    lichess_id: Optional[str] = None
    password: str
    email: str

class SignInRequest(BaseModel):
    password: str
    emailOrUsername: str

class UpdateChessComUsername(BaseModel):
    chess_com_username: str