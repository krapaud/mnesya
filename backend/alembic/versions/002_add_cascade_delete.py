"""add cascade delete on user foreign keys

Revision ID: 002
Revises: 121727de92d3
Create Date: 2026-02-27 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '002'
down_revision: Union[str, None] = '121727de92d3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- reminder: user_id → user.id WITH CASCADE ---
    op.drop_constraint('reminder_user_id_fkey', 'reminder', type_='foreignkey')
    op.create_foreign_key(
        'reminder_user_id_fkey',
        'reminder', 'user',
        ['user_id'], ['id'],
        ondelete='CASCADE'
    )

    # --- reminder_status: reminder_id → reminder.id WITH CASCADE ---
    op.drop_constraint('reminder_status_reminder_id_fkey', 'reminder_status', type_='foreignkey')
    op.create_foreign_key(
        'reminder_status_reminder_id_fkey',
        'reminder_status', 'reminder',
        ['reminder_id'], ['id'],
        ondelete='CASCADE'
    )

    # --- pairing_code: user_id → user.id WITH CASCADE ---
    op.drop_constraint('pairing_code_user_id_fkey', 'pairing_code', type_='foreignkey')
    op.create_foreign_key(
        'pairing_code_user_id_fkey',
        'pairing_code', 'user',
        ['user_id'], ['id'],
        ondelete='CASCADE'
    )

    # --- push_token: user_id → user.id WITH CASCADE ---
    op.drop_constraint('push_token_user_id_fkey', 'push_token', type_='foreignkey')
    op.create_foreign_key(
        'push_token_user_id_fkey',
        'push_token', 'user',
        ['user_id'], ['id'],
        ondelete='CASCADE'
    )


def downgrade() -> None:
    # Restore FK constraints without CASCADE

    op.drop_constraint('push_token_user_id_fkey', 'push_token', type_='foreignkey')
    op.create_foreign_key(
        'push_token_user_id_fkey',
        'push_token', 'user',
        ['user_id'], ['id']
    )

    op.drop_constraint('pairing_code_user_id_fkey', 'pairing_code', type_='foreignkey')
    op.create_foreign_key(
        'pairing_code_user_id_fkey',
        'pairing_code', 'user',
        ['user_id'], ['id']
    )

    op.drop_constraint('reminder_status_reminder_id_fkey', 'reminder_status', type_='foreignkey')
    op.create_foreign_key(
        'reminder_status_reminder_id_fkey',
        'reminder_status', 'reminder',
        ['reminder_id'], ['id']
    )

    op.drop_constraint('reminder_user_id_fkey', 'reminder', type_='foreignkey')
    op.create_foreign_key(
        'reminder_user_id_fkey',
        'reminder', 'user',
        ['user_id'], ['id']
    )
