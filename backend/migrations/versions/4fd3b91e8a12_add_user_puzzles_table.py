"""add user_puzzles table

Revision ID: 4fd3b91e8a12
Revises: 1986a8b891d0
Create Date: 2026-04-04 16:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "4fd3b91e8a12"
down_revision: Union[str, Sequence[str], None] = "1986a8b891d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "user_puzzles",
        sa.Column("puzzle_id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("game_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("user_games.game_id", ondelete="CASCADE"), nullable=False),
        sa.Column("start_fen", sa.Text(), nullable=False),
        sa.Column("source_half_move_index", sa.Integer(), nullable=False),
        sa.Column("played_move", sa.String(), nullable=False),
        sa.Column("best_move", sa.String(), nullable=True),
        sa.Column("solution_uci", sa.JSON(), nullable=False),
        sa.Column("cp", sa.Integer(), nullable=True),
        sa.Column("raw_tags", sa.JSON(), nullable=True),
        sa.Column("normalized_tags", sa.JSON(), nullable=True),
        sa.Column("candidate_score", sa.Float(), nullable=True),
        sa.Column("status", sa.String(), nullable=False, server_default="candidate"),
        sa.UniqueConstraint("user_id", "game_id", "source_half_move_index", name="uq_user_puzzles_candidate_key"),
    )
    op.create_index("ix_user_puzzles_user_id", "user_puzzles", ["user_id"], unique=False)
    op.create_index("ix_user_puzzles_game_id", "user_puzzles", ["game_id"], unique=False)
    op.create_index("ix_user_puzzles_status", "user_puzzles", ["status"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_user_puzzles_status", table_name="user_puzzles")
    op.drop_index("ix_user_puzzles_game_id", table_name="user_puzzles")
    op.drop_index("ix_user_puzzles_user_id", table_name="user_puzzles")
    op.drop_table("user_puzzles")
