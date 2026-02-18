"""add user_games table

Revision ID: c4d5e6f7a8b9
Revises: b2c3d4e5f6a7
Create Date: 2026-02-17 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "c4d5e6f7a8b9"
down_revision: Union[str, Sequence[str], None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_games",
        sa.Column("game_id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("pgn", sa.Text(), nullable=False),
        sa.Column("tcn", sa.Text(), nullable=True),
        sa.Column("chess_com_username", sa.String(), nullable=False),
        sa.Column("chess_com_game_uuid", sa.String(), nullable=True),
        sa.Column("end_time", sa.BigInteger(), nullable=True),
        sa.Column("time_class", sa.String(), nullable=True),
        sa.Column("time_control", sa.String(), nullable=True),
        sa.Column("white_username", sa.String(), nullable=True),
        sa.Column("black_username", sa.String(), nullable=True),
        sa.Column("white_result", sa.String(), nullable=True),
        sa.Column("black_result", sa.String(), nullable=True),
    )
    op.create_index("ix_user_games_user_id", "user_games", ["user_id"], unique=False)
    op.create_index("ix_user_games_user_chess_com_uuid", "user_games", ["user_id", "chess_com_game_uuid"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_user_games_user_chess_com_uuid", table_name="user_games")
    op.drop_index("ix_user_games_user_id", table_name="user_games")
    op.drop_table("user_games")
