"""User model module.

This module defines the User entity with all its attributes and business logic.
Users are the elderly individuals being cared for by caregivers.
"""

import uuid
from datetime import datetime, timezone, date
from sqlalchemy import Column, String, DateTime, Date, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from app import database

class UserModel(database):
    """User model representing an elderly person in the care system.
    
    This model stores information about users (elderly individuals) including
    their personal details, associated caregivers, and timestamps.
    
    Attributes:
        id (UUID): Unique identifier for the user
        first_name (str): User's first name (max 100 chars)
        last_name (str): User's last name (max 100 chars)
        birthday (date): User's date of birth
        caregiver_ids (list[UUID]): List of associated caregiver IDs
        created_at (datetime): Timestamp of user creation
        updated_at (datetime): Timestamp of last update
    """
    __tablename__ = 'user'
    _id = Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    _first_name = Column('first_name', String(100), nullable=False)
    _last_name = Column('last_name', String(100), nullable=False)
    _birthday = Column('birthday', Date, nullable=False)
    _caregiver_ids = Column('caregiver_ids', ARRAY(UUID(as_uuid=True), ForeignKey('caregiver.id')), default=list)
    _created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    _updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # ==================== Getter Setter ====================

    @property
    def id(self):
        """Get the user's unique identifier.
        
        Returns:
            UUID: The user's ID
        """
        return self._id

    @property
    def first_name(self) -> str:
        """Get the user's first name.
        
        Returns:
            str: The user's first name
        """
        return self._first_name

    @first_name.setter
    def first_name(self, value: str) -> None:
        """Set the user's first name with validation.
        
        Args:
            value (str): The first name to set
            
        Raises:
            ValueError: If name is empty, only whitespace, or exceeds 100 characters
        """
        if (not value or len(value) > 100 or len(value.strip()) == 0):
            raise ValueError("First name is required and must be <= 100 chars")
        self._first_name = value.strip()

    @property
    def last_name(self) -> str:
        """Get the user's last name.
        
        Returns:
            str: The user's last name
        """
        return self._last_name

    @last_name.setter
    def last_name(self, value: str) -> None:
        """Set the user's last name with validation.
        
        Args:
            value (str): The last name to set
            
        Raises:
            ValueError: If name is empty, only whitespace, or exceeds 100 characters
        """
        if (not value or len(value) > 100 or len(value.strip()) == 0):
            raise ValueError("last name is required and must be <= 100 chars")
        self._last_name = value.strip()

    @property
    def birthday(self) -> date:
        """Get the user's birthday.
        
        Returns:
            date: The user's date of birth
        """
        return self._birthday

    @birthday.setter
    def birthday(self, value) -> None:
        """Set the user's birthday with comprehensive validation.
        
        Args:
            value (date or str): Birthday as date object or YYYY-MM-DD string
            
        Raises:
            ValueError: If birthday format is invalid, in the future, or results in unrealistic age
        """
        # Convert string to date if needed
        if isinstance(value, str):
            try:
                value = datetime.strptime(value, "%Y-%m-%d").date()
            except ValueError:
                raise ValueError("Birthday must be in YYYY-MM-DD format")
        
        # Validate type
        if not isinstance(value, date):
            raise ValueError("Birthday must be a date object or string")
        
        # Birthday cannot be in the future
        if value > date.today():
            raise ValueError("Birthday cannot be in the future")
        
        # Calculate age and validate it's realistic
        today = date.today()
        age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))
        
        if age < 0:
            raise ValueError("Invalid birthday")
        if age > 150:
            raise ValueError("Birthday results in unrealistic age")
        self._birthday = value

    @property
    def caregiver_ids(self) -> list:
        """Get the list of associated caregiver IDs.
        
        Returns:
            list[UUID]: List of caregiver UUIDs, empty list if none
        """
        # Convert tuple to list if needed (SQLAlchemy returns tuples for ARRAY columns)
        if self._caregiver_ids is None:
            return []
        return list(self._caregiver_ids) if isinstance(self._caregiver_ids, tuple) else self._caregiver_ids

    @caregiver_ids.setter
    def caregiver_ids(self, value: list) -> None:
        """Set the list of caregiver IDs.
        
        Args:
            value (list[UUID]): List of caregiver UUIDs
        """
        self._caregiver_ids = value

    @property
    def created_at(self) -> datetime:
        """Get the creation timestamp.
        
        Returns:
            datetime: When this user was created
        """
        return self._created_at

    @property
    def updated_at(self) -> datetime:
        """Get the last update timestamp.
        
        Returns:
            datetime: When this user was last updated
        """
        return self._updated_at

    # ==================== object function ====================

    def add_caregiver(self, caregiver_id: uuid.UUID) -> None:
        """Add a caregiver to this user's caregiver list.
        
        Args:
            caregiver_id (UUID): The caregiver's unique identifier
            
        Note:
            Will not add duplicate IDs - caregiver can only be added once
        """
        # Convert to list if it's a tuple (SQLAlchemy returns tuples for ARRAY columns)
        if self._caregiver_ids is None:
            self._caregiver_ids = []
        elif isinstance(self._caregiver_ids, tuple):
            self._caregiver_ids = list(self._caregiver_ids)
        
        if caregiver_id not in self._caregiver_ids:
            self._caregiver_ids.append(caregiver_id)

    def remove_caregiver(self, caregiver_id: uuid.UUID) -> None:
        """Remove a caregiver from this user's caregiver list.
        
        Args:
            caregiver_id (UUID): The caregiver's unique identifier
            
        Note:
            Silently does nothing if caregiver is not in the list
        """
        if self._caregiver_ids and caregiver_id in self._caregiver_ids:
            self._caregiver_ids.remove(caregiver_id)

    def get_age(self) -> int:
        """Calculate the user's current age based on their birthday.
        
        Returns:
            int: The user's age in years, or None if birthday is not set
            
        Note:
            Age is calculated considering whether birthday has occurred this year
        """
        if not self._birthday:
            return None
        today = date.today()
        # Subtract 1 from age if birthday hasn't occurred yet this year
        return today.year - self._birthday.year - ((today.month, today.day) < (self._birthday.month, self._birthday.day))
