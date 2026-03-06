"""Revoked Token model module."""

from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime
from app import database


class RevokedTokenModel(database):
    """Stores revoked JWT JTIs for server-side token invalidation."""

    __tablename__ = "revoked_token"

    _jti = Column("jti", String(36), primary_key=True)
    _revoked_at = Column("revoked_at", DateTime(timezone=True), nullable=False,
                         default=lambda: datetime.now(timezone.utc))

    @property
    def jti(self) -> str:
        return self._jti

    @property
    def revoked_at(self) -> datetime:
        return self._revoked_at
