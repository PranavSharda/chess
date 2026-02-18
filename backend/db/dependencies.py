"""Dependency injection helpers for repositories."""
from typing import Generator
from fastapi import Depends

from db.sessions import get_session
from db.repositories import UserRepository, UserGameRepository
from sqlalchemy.orm import Session


def get_user_repository(
    session: Session = Depends(get_session)
) -> Generator[UserRepository, None, None]:
    """Get UserRepository instance."""
    yield UserRepository(session)


def get_user_game_repository(
    session: Session = Depends(get_session)
) -> Generator[UserGameRepository, None, None]:
    """Get UserGameRepository instance."""
    yield UserGameRepository(session)

