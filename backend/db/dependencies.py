"""Dependency injection helpers for repositories."""
from typing import Generator
from fastapi import Depends

from db.sessions import get_session
from db.repositories import UserRepository
from sqlalchemy.orm import Session


def get_user_repository(
    session: Session = Depends(get_session)
) -> Generator[UserRepository, None, None]:
    """Get UserRepository instance."""
    yield UserRepository(session)

