"""add trend analysis table

Revision ID: cc75d8b2e7ba
Revises: c4d5e6f7a8b9
Create Date: 2026-03-15 17:45:36.917033

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cc75d8b2e7ba'
down_revision: Union[str, Sequence[str], None] = 'c4d5e6f7a8b9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('user_games', sa.Column('analysed_game', sa.JSON(), nullable=True))
    op.add_column('user_games', sa.Column('black_accuracy', sa.Float(), nullable=True))
    op.add_column('user_games', sa.Column('white_accuracy', sa.Float(), nullable=True))
    op.add_column('user_games', sa.Column('user_blunder_count', sa.Integer(), nullable=True))
    op.add_column('user_games', sa.Column('white_rating', sa.Integer(), nullable=True))
    op.add_column('user_games', sa.Column('black_rating', sa.Integer(), nullable=True))



def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('user_games', 'user_blunder_count')
    op.drop_column('user_games', 'white_accuracy')
    op.drop_column('user_games', 'black_accuracy')
    op.drop_column('user_games', 'analysed_game')
    op.drop_column('user_games','white_rating')
    op.drop_column('user_games','black_rating')
