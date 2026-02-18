from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, BigInteger
from sqlalchemy.dialects.postgresql import UUID
import uuid

from db.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    password_salt = Column(String, nullable=False)
    lichess_id = Column(String, nullable=True)
    chess_com_username = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class UserGame(Base):
    """Stored Chess.com games for a user."""

    __tablename__ = "user_games"

    game_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    pgn = Column(Text, nullable=False)
    tcn = Column(Text, nullable=True)
    chess_com_username = Column(String, nullable=False)
    chess_com_game_uuid = Column(String, nullable=True)
    end_time = Column(BigInteger, nullable=True)
    time_class = Column(String, nullable=True)
    time_control = Column(String, nullable=True)
    white_username = Column(String, nullable=True)
    black_username = Column(String, nullable=True)
    white_result = Column(String, nullable=True)
    black_result = Column(String, nullable=True)
