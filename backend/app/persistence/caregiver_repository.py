"""Caregiver Repository module.

This module provides data access operations specific to Caregiver entities.
"""

from app.models.caregiver import CaregiverModel
from app.persistence.base_repository import BaseRepository
from sqlalchemy.orm import Session

class CaregiverRepository(BaseRepository[CaregiverModel]):
    """Repository for Caregiver entity data access.
    
    Extends BaseRepository with caregiver-specific query methods,
    particularly for authentication and email lookup.
    """
    def __init__(self, db: Session):
        """Initialize the CaregiverRepository with CaregiverModel."""
        super().__init__(CaregiverModel, db)

    def get_caregiver_by_email(self, email: str):
        """Get a caregiver by their email address.
        
        Args:
            email (str): The email address to search for
            
        Returns:
            Optional[CaregiverModel]: The caregiver if found, None otherwise
            
        Note:
            Email is indexed in the database for fast lookup
            Used for login authentication
        """
        return self.db.query(self.model).filter(self.model._email == email).first()

    def email_exists(self, email: str) -> bool:
        """Check if an email address is already registered.
        
        Args:
            email (str): The email address to check
            
        Returns:
            bool: True if email exists, False otherwise
            
        Note:
            Useful for registration validation to prevent duplicates
        """
        return self.db.query(self.model).filter(self.model._email == email).first() is not None
