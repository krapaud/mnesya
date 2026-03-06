"""Add revoked_tokens table for server-side JWT revocation

Revision ID: 004
Revises: 003
Create Date: 2026-03-05 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "revoked_token",
        sa.Column("jti", sa.String(length=36), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("jti"),
    )
    op.create_index("ix_revoked_token_revoked_at", "revoked_token", ["revoked_at"])


def downgrade() -> None:
    op.drop_index("ix_revoked_token_revoked_at", table_name="revoked_token")
    op.drop_table("revoked_token")
