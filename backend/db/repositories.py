from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import or_

from db.repository import BaseRepository
from db.models import User


class UserRepository(BaseRepository[User]):
    """Repository for User model with specific query methods."""
    
    def __init__(self, session: Session):
        super().__init__(User, session)
    
    def get_by_username(self, username: str) -> Optional[User]:
        """Get user by username."""
        return self.first(username=username)
    
    def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        return self.first(email=email)
    
    def get_by_lichess_id(self, lichess_id: str) -> Optional[User]:
        """Get user by Lichess ID."""
        return self.first(lichess_id=lichess_id)
    
    def search_by_username_or_email(self, query: str) -> List[User]:
        """Search users by username or email."""
        return self.filter(
            or_(
                User.username.ilike(f"%{query}%"),
                User.email.ilike(f"%{query}%")
            )
        )
    
    def get_users_with_lichess(self) -> List[User]:
        """Get all users who have linked their Lichess account."""
        return self.filter(User.lichess_id.isnot(None))
    
    def username_exists(self, username: str) -> bool:
        """Check if username already exists."""
        return self.exists(username=username)
    
    def email_exists(self, email: str) -> bool:
        """Check if email already exists."""
        return self.exists(email=email)

