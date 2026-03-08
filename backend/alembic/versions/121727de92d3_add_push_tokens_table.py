"""add_push_tokens_table

Revision ID: 121727de92d3
Revises: 001
Create Date: 2026-02-24 09:28:39.433139

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '121727de92d3'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create push_token table
    op.create_table(
        'push_token',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('token', sa.String(length=255), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('caregiver_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('device_name', sa.String(length=100), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
        sa.ForeignKeyConstraint(['caregiver_id'], ['caregiver.id'], ),
        sa.UniqueConstraint('token')
    )
    
    # Create indexes for performance
    op.create_index('ix_push_token_user_id', 'push_token', ['user_id'], unique=False)
    op.create_index('ix_push_token_caregiver_id', 'push_token', ['caregiver_id'], unique=False)
    op.create_index('ix_push_token_is_active', 'push_token', ['is_active'], unique=False)


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_push_token_is_active', table_name='push_token')
    op.drop_index('ix_push_token_caregiver_id', table_name='push_token')
    op.drop_index('ix_push_token_user_id', table_name='push_token')
    
    # Drop table
    op.drop_table('push_token')
