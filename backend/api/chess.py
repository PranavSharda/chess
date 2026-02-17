from fastapi import APIRouter, Depends
from db.models import User
from core.auth import get_current_user

router = APIRouter()


@router.get('/games')
def get_games(user_id: str, current_user: User = Depends(get_current_user)):
    """Return all games for a user. Requires authentication."""
    return {
        "games": []
    }
