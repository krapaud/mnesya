"""User Facade module.

This module implements the Facade pattern for User business logic.
It provides a simplified interface for user operations, coordinating
between the model layer and repository layer.
"""

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
    def __init__(self):
        """Initialize the facade with a user repository."""
        self.user_repo = UserRepository()

    # ==================== USER BUSINESS LOGIC ====================

    def create_user(self, user_data: dict) -> object:
        """Create a new user.
        
        Business logic for user creation. Validates data through the model's
        property setters and persists to the database.
        
        Args:
            user_data (dict): Dictionary containing user fields (first_name, last_name, birthday)
            
        Returns:
            UserModel: The created user with generated ID and timestamps
            
        Raises:
            ValueError: If validation fails (from model setters)
            Exception: If database operation fails
        """
        user = UserModel(**user_data)
        self.user_repo.add(user)
        return user

    def get_user(self, user_id: str) -> object:
        """Retrieve a user by ID.
        
        Args:
            user_id (str): The user's unique identifier
            
        Returns:
            UserModel: The user if found, None otherwise
        """
        return self.user_repo.get(user_id)

    def get_all_users(self) -> list:
        """Retrieve all users.
        
        Returns:
            list[UserModel]: List of all users in the system
            
        Warning:
            Use with caution on large datasets - consider pagination
        """
        return self.user_repo.get_all()

    def update_user(self, user_id: str, user_data: dict) -> object:
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

    def delete_user(self, user_id: str) -> bool:
        """Delete a user.
        
        Args:
            user_id (str): The user's unique identifier
            
        Returns:
            bool: True if user was found and deleted, False if not found
            
        Raises:
            Exception: If database operation fails
        """
        user = self.user_repo.get(user_id)
        if user:
            self.user_repo.delete(user_id)
            return True
        return False
