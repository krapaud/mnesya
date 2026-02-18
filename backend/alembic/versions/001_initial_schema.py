"""Initial schema with all tables

Revision ID: 001
Revises: 
Create Date: 2026-02-17 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create caregiver table
    op.create_table('caregiver',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('first_name', sa.String(length=100), nullable=False),
        sa.Column('last_name', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password', sa.String(length=255), nullable=False),
        sa.Column('user_ids', sa.ARRAY(postgresql.UUID(as_uuid=True)), nullable=True),
        sa.Column('_created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('_updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_caregiver_email'), 'caregiver', ['email'], unique=True)
    
    # Create user table
    op.create_table('user',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('first_name', sa.String(length=100), nullable=False),
        sa.Column('last_name', sa.String(length=100), nullable=False),
        sa.Column('birthday', sa.Date(), nullable=False),
        sa.Column('caregiver_ids', sa.ARRAY(postgresql.UUID(as_uuid=True)), nullable=True),
        sa.Column('_created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('_updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create reminder table (with scheduled_at)
    op.create_table('reminder',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('scheduled_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('caregiver_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('_created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('_updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['caregiver_id'], ['caregiver.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create reminder_status table
    op.create_table('reminder_status',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('status', sa.String(length=15), nullable=False),
        sa.Column('reminder_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('_created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('_updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['reminder_id'], ['reminder.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create pairing_code table
    op.create_table('pairing_code',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('code', sa.String(6), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('caregiver_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('is_used', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('_created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
        sa.ForeignKeyConstraint(['caregiver_id'], ['caregiver.id'], ),
        sa.UniqueConstraint('code')
    )
    op.create_index(op.f('ix_pairing_code_code'), 'pairing_code', ['code'], unique=True)


def downgrade() -> None:
    # Drop tables in reverse order (respecting foreign keys)
    op.drop_index(op.f('ix_pairing_code_code'), table_name='pairing_code')
    op.drop_table('pairing_code')
    op.drop_table('reminder_status')
    op.drop_table('reminder')
    op.drop_table('user')
    op.drop_index(op.f('ix_caregiver_email'), table_name='caregiver')
    op.drop_table('caregiver')
