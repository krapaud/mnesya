"""add_scheduled_at_to_reminder

Revision ID: f4a22817fa9a
Revises: be527742fbf8
Create Date: 2026-02-05 10:53:24.353570

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f4a22817fa9a'
down_revision: Union[str, None] = 'be527742fbf8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Ajout de la colonne scheduled_at à la table reminder
    op.add_column('reminder', sa.Column('scheduled_at', sa.DateTime(timezone=True), nullable=False))


def downgrade() -> None:
    # Suppression de la colonne scheduled_at de la table reminder
    op.drop_column('reminder', 'scheduled_at')
