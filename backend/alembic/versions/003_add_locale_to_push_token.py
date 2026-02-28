"""Add locale column to push_token table

Revision ID: 003
Revises: 121727de92d3
Create Date: 2026-02-28 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '003'
down_revision: Union[str, None] = '121727de92d3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('push_token', sa.Column('locale', sa.String(length=5), nullable=True, server_default='fr'))


def downgrade() -> None:
    op.drop_column('push_token', 'locale')
