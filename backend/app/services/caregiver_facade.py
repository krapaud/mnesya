"""Caregiver Facade module.

This module implements the Facade pattern for Caregiver business logic.
It provides a simplified interface for caregiver operations, including
authentication and user management.
"""
from sqlalchemy.orm import Session
from app.models.caregiver import CaregiverModel
from app.persistence.caregiver_repository import CaregiverRepository

class CaregiverFacade:
    """Facade for Caregiver business logic operations.
    
    This class implements the Facade pattern to provide a clean interface
    for caregiver-related operations. It handles authentication, user management,
    and coordinates between the model and repository layers.
    
    Attributes:
        caregiver_repo (CaregiverRepository): Repository for caregiver data access
    """
    def __init__(self, db: Session):
        """Initialize the facade with a caregiver repository."""
        self.caregiver_repo = CaregiverRepository(db)

    # ==================== CAREGIVER BUSINESS LOGIC ====================

    def create_caregiver(self, caregiver_data: dict) -> object:
        """Create a new caregiver with hashed password.
        
        Business logic for caregiver registration. Creates the caregiver,
        hashes their password, and persists to the database.
        
        Args:
            caregiver_data (dict): Dictionary containing caregiver fields
                                   (first_name, last_name, email, password)
            
        Returns:
            CaregiverModel: The created caregiver with generated ID and timestamps
            
        Raises:
            ValueError: If validation fails (from model setters)
            Exception: If database operation fails or email already exists
            
        Note:
            Password is automatically hashed before storage
        """
        caregiver = CaregiverModel(**caregiver_data)
        caregiver.hash_password(caregiver_data['password'])  # Hash the password
        self.caregiver_repo.add(caregiver)
        return caregiver

    def get_caregiver(self, caregiver_id: str) -> object:
        """Retrieve a caregiver by ID.
        
        Args:
            caregiver_id (str): The caregiver's unique identifier
            
        Returns:
            CaregiverModel: The caregiver if found, None otherwise
        """
        return self.caregiver_repo.get(caregiver_id)

    def get_caregiver_by_email(self, email: str) -> object:
        """Retrieve a caregiver by email address.
        
        Used primarily for authentication and login.
        
        Args:
            email (str): The caregiver's email address
            
        Returns:
            CaregiverModel: The caregiver if found, None otherwise
        """
        return self.caregiver_repo.get_caregiver_by_email(email)

    def get_all_caregivers(self) -> list:
        """Retrieve all caregivers.
        
        Returns:
            list[CaregiverModel]: List of all caregivers in the system
            
        Warning:
            Use with caution on large datasets - consider pagination
        """
        return self.caregiver_repo.get_all()

    def update_caregiver(self, caregiver_id: str, caregiver_data: dict) -> object:
        """Update an existing caregiver.
        
        Business logic for caregiver updates. Only updates provided fields.
        
        Args:
            caregiver_id (str): The caregiver's unique identifier
            caregiver_data (dict): Dictionary of fields to update
            
        Returns:
            CaregiverModel: The updated caregiver if found, None otherwise
            
        Raises:
            ValueError: If validation fails (from model setters)
            Exception: If database operation fails
            
        Note:
            If password is updated, it should be hashed before calling this method
        """
        self.caregiver_repo.update(caregiver_id, caregiver_data)
        return self.caregiver_repo.get(caregiver_id)

    def delete_caregiver(self, caregiver_id: str) -> bool:
        """Delete a caregiver.
        
        Args:
            caregiver_id (str): The caregiver's unique identifier
            
        Returns:
            bool: True if caregiver was found and deleted, False if not found
            
        Raises:
            Exception: If database operation fails
            
        Warning:
            Consider impact on associated users before deletion
        """
        caregiver = self.caregiver_repo.get(caregiver_id)
        if caregiver:
            self.caregiver_repo.delete(caregiver_id)
            return True
        return False
