"""Revoked Token Repository module."""

from datetime import datetime, timezone
from app.persistence.base_repository import BaseRepository
from app.models.revoked_token import RevokedTokenModel


class RevokedTokenRepository(BaseRepository):
    """Repository for RevokedToken data access operations."""

    def __init__(self, db):
        super().__init__(RevokedTokenModel, db)

    def is_revoked(self, jti: str) -> bool:
        """Check if a JTI is in the blacklist."""
        return self.db.query(RevokedTokenModel).filter(
            RevokedTokenModel._jti == jti
        ).first() is not None

    def revoke(self, jti: str) -> None:
        """Add a JTI to the blacklist"""
        token = RevokedTokenModel()
        token._jti = jti
        token._revoked_at = datetime.now(timezone.utc)
        self.db.add(token)
        self.db.commit()

    def delete_expired(self, before: datetime):
        """Delete tokens revoked before a given datetime. Returns count deleted."""
        deleted = self.db.query(RevokedTokenModel).filter(
            RevokedTokenModel._revoked_at < before
        ).delete()
        self.db.commit()
        return deleted
