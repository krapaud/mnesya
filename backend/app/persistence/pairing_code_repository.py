"""Pairing Code Repository module."""

from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.pairing_code import PairingCodeModel
from app.persistence.base_repository import BaseRepository


class PairingCodeRepository(BaseRepository[PairingCodeModel]):
    """Repository for pairing code data access."""

    def __init__(self, db: Session):
        super().__init__(PairingCodeModel, db)

    def find_by_code(self, code: str) -> Optional[PairingCodeModel]:
        """Find a pairing code by its code string."""
        return self.db.query(self.model).filter(
            self.model._code == code.upper()
        ).first()

    def find_active_by_user_id(
            self, user_id: UUID) -> Optional[PairingCodeModel]:
        """Find an active (unused, non-expired) pairing code for a user."""
        from datetime import datetime, timezone
        return self.db.query(self.model).filter(
            self.model._user_id == user_id,
            self.model._is_used.is_(False),
            self.model._expires_at > datetime.now(timezone.utc)
        ).first()
