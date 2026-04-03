from typing import Optional, List
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import or_, nulls_last

from db.repository import BaseRepository
from db.models import User, UserGame


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


class UserGameRepository(BaseRepository[UserGame]):
    """Repository for UserGame model."""

    def __init__(self, session: Session):
        super().__init__(UserGame, session)

    def get_by_id(self, id: UUID) -> Optional[UserGame]:
        """Get a single game by its primary key."""
        return self.session.query(UserGame).filter(UserGame.game_id == id).first()

    def get_by_game_id(self, game_id: UUID) -> Optional[UserGame]:
        """Get a single game by its primary key."""
        return self.get_by_id(game_id)
    
    def get_by_user_id(
        self, user_id: UUID, limit: int = 500, offset: int = 0,
        min_end_time: Optional[int] = None, time_class: Optional[str] = None,
    ) -> List[UserGame]:
        """Get games for a user, newest first. Optionally filter by min end_time and time_class."""
        q = self.session.query(UserGame).filter(UserGame.user_id == user_id)
        if min_end_time is not None:
            q = q.filter(UserGame.end_time >= min_end_time)
        if time_class is not None:
            q = q.filter(UserGame.time_class == time_class)
        return q.order_by(nulls_last(UserGame.end_time.desc())).offset(offset).limit(limit).all()

    def get_analysed_by_user_id(
        self, user_id: UUID, min_end_time: Optional[int] = None, time_class: Optional[str] = None,
    ) -> List[UserGame]:
        """Get all analysed games for a user, optionally filtered by min end_time and time_class."""
        q = (
            self.session.query(UserGame)
            .filter(UserGame.user_id == user_id, UserGame.is_analysed == True)
        )
        if min_end_time is not None:
            q = q.filter(UserGame.end_time >= min_end_time)
        if time_class is not None:
            q = q.filter(UserGame.time_class == time_class)
        return q.all()

    def count_by_user_id(self, user_id: UUID) -> int:
        """Count games for a user."""
        return self.session.query(UserGame).filter(UserGame.user_id == user_id).count()

    def exists_chess_com_game(self, user_id: UUID, chess_com_game_uuid: str) -> bool:
        """Check if we already have this Chess.com game for this user."""
        return (
            self.session.query(UserGame)
            .filter(
                UserGame.user_id == user_id,
                UserGame.chess_com_game_uuid == chess_com_game_uuid,
            )
            .first()
            is not None
        )

    def get_existing_chess_com_uuids(self, user_id: UUID) -> set[str]:
        """Return all Chess.com game UUIDs already stored for this user."""
        rows = (
            self.session.query(UserGame.chess_com_game_uuid)
            .filter(
                UserGame.user_id == user_id,
                UserGame.chess_com_game_uuid.isnot(None),
            )
            .all()
        )
        return {r[0] for r in rows}

