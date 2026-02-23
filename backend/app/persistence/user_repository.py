"""User Repository module.

This module provides data access operations specific to User entities.
"""

from typing import List
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.user import UserModel
from app.persistence.base_repository import BaseRepository


class UserRepository(BaseRepository[UserModel]):
    """Repository for User entity data access.

    Extends BaseRepository with user-specific query methods.
    """

    def __init__(self, db: Session):
        """Initialize the UserRepository with UserModel and database session."""
        super().__init__(UserModel, db)

    def get_users_by_caregiver(self, caregiver_id: UUID) -> List[UserModel]:
        """Get all users associated with a specific caregiver.

        Args:
            caregiver_id (UUID): The caregiver's unique identifier

        Returns:
            List[UserModel]: List of users under this caregiver's care (may be empty)
        """
        return self.db.query(self.model).filter(
            self.model._caregiver_ids.contains([caregiver_id])
        ).all()
