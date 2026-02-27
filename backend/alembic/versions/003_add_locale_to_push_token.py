"""add locale to push_token

Revision ID: 003
Revises: 002
Create Date: 2026-02-27 00:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '003'
down_revision: Union[str, None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('push_token', sa.Column('locale', sa.String(length=10), nullable=True))


def downgrade() -> None:
    op.drop_column('push_token', 'locale')
