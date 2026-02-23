"""User Facade module.

This module implements the Facade pattern for User business logic.
It provides a simplified interface for user operations, coordinating
between the model layer and repository layer.
"""

from sqlalchemy.orm import Session
from uuid import UUID
from typing import List
from app.models.user import UserModel
from app.persistence.user_repository import UserRepository


class UserFacade:
    """Facade for User business logic operations.

    This class implements the Facade pattern to provide a clean interface
    for user-related operations. It handles business logic and coordinates
    between the model and repository layers.

    Attributes:
        user_repo (UserRepository): Repository for user data access
    """

    def __init__(self, db: Session):
        """Initialize the facade with a user repository."""
        self.user_repo = UserRepository(db)

    # ==================== USER BUSINESS LOGIC ====================

    def create_user(self, user_data: dict, caregiver_id: UUID) -> UserModel:
        """Create a new user profile and associate with caregiver.

        Args:
            user_data (dict): Dictionary containing user fields
            caregiver_id (UUID): ID of the caregiver creating the profile

        Returns:
            UserModel: The created user
        """
        user = UserModel(**user_data)
        user.add_caregiver(caregiver_id)
        self.user_repo.add(user)
        return user

    def get_user(self, user_id: UUID) -> UserModel:
        """Retrieve a user by ID.

        Args:
            user_id (str): The user's unique identifier

        Returns:
            UserModel: The user if found, None otherwise
        """
        return self.user_repo.get(user_id)

    def get_users_by_caregiver(self, caregiver_id: UUID) -> List[UserModel]:
        """Get all users associated with a caregiver."""
        return self.user_repo.get_users_by_caregiver(caregiver_id)

    def update_user(self, user_id: UUID, user_data: dict) -> UserModel:
        """Update an existing user.

        Business logic for user updates. Only updates provided fields.

        Args:
            user_id (str): The user's unique identifier
            user_data (dict): Dictionary of fields to update

        Returns:
            UserModel: The updated user if found, None otherwise

        Raises:
            ValueError: If validation fails (from model setters)
            Exception: If database operation fails
        """
        self.user_repo.update(user_id, user_data)
        return self.user_repo.get(user_id)

    def delete_user(self, user_id: UUID) -> bool:
        """Delete a user.

        Args:
            user_id (str): The user's unique identifier

        Returns:
            bool: True if user was found and deleted, False if not found

        Raises:
            Exception: If database operation fails
        """
        return self.user_repo.delete(user_id)
