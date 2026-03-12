"""Add recurrence_days column to reminder table

Revision ID: 006
Revises: 005
Create Date: 2026-03-12 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '006'
down_revision: Union[str, None] = '005'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'reminder',
        sa.Column(
            'recurrence_days',
            postgresql.ARRAY(sa.Integer()),
            nullable=True,
            server_default=None,
        ),
    )


def downgrade() -> None:
    op.drop_column('reminder', 'recurrence_days')
