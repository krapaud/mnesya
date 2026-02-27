"""Push Token Repository module.

This module provides data access methods for PushToken entities.
"""

from app.persistence.base_repository import BaseRepository
from app.models.push_token import PushTokenModel
from uuid import UUID


class PushTokenRepository(BaseRepository):
    """Repository for PushToken data access operations."""

    def __init__(self, db):
        """Initialize repository with PushToken model."""
        super().__init__(PushTokenModel, db)

    def get_by_token(self, token: str):
        """Get a push token by its token string.

        Args:
            token (str): The Expo push token string

        Returns:
            PushTokenModel: The token record if found, None otherwise
        """
        return self.db.query(PushTokenModel).filter(
            PushTokenModel._token == token
        ).first()

    def get_active_tokens_by_user(self, user_id: UUID):
        """Get all active push tokens for a user.

        Args:
            user_id (UUID): The user's unique identifier

        Returns:
            list[PushTokenModel]: List of active tokens for the user
        """
        return self.db.query(PushTokenModel).filter(
            PushTokenModel._user_id == user_id,
            PushTokenModel._is_active == True
        ).all()

    def get_active_tokens_by_caregiver(self, caregiver_id: UUID):
        """Get all active push tokens for a caregiver.

        Args:
            caregiver_id (UUID): The caregiver's unique identifier

        Returns:
            list[PushTokenModel]: List of active tokens for the caregiver
        """
        return self.db.query(PushTokenModel).filter(
            PushTokenModel._caregiver_id == caregiver_id,
            PushTokenModel._is_active == True
        ).all()

    def deactivate_token(self, token: str) -> bool:
        """Deactivate a push token.

        Args:
            token (str): The Expo push token string

        Returns:
            bool: True if token was found and deactivated, False otherwise
        """
        token_record = self.get_by_token(token)
        if token_record:
            token_record.is_active = False
            self.db.commit()
            return True
        return False

    def delete_by_token(self, token: str) -> bool:
        """Delete a push token by its token string.

        Args:
            token (str): The Expo push token string

        Returns:
            bool: True if deleted, False if not found
        """
        token_record = self.get_by_token(token)
        if token_record:
            self.db.delete(token_record)
            self.db.commit()
            return True
        return False
