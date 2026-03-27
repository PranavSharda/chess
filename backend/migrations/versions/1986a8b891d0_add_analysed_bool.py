"""add analysed bool

Revision ID: 1986a8b891d0
Revises: cc75d8b2e7ba
Create Date: 2026-03-28 02:18:58.074750

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1986a8b891d0'
down_revision: Union[str, Sequence[str], None] = 'cc75d8b2e7ba'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('user_games', sa.Column('is_analysed', sa.Boolean(), nullable=False, server_default=sa.false()))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('user_games', 'is_analysed')
