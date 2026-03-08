"""Pairing Code model module.

This module defines the PairingCode entity for user-caregiver pairing.
"""

import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app import database


class PairingCodeModel(database):
    """Pairing Code model for user-caregiver pairing.

    Stores temporary pairing codes that allow users to connect with caregivers.
    Codes expire after 24 hours and can only be used once.

    Attributes:
        id (UUID): Unique identifier
        code (str): 6-character alphanumeric pairing code
        user_id (UUID): Associated user ID
        caregiver_id (UUID): Associated caregiver ID
        expires_at (datetime): Expiration timestamp
        is_used (bool): Whether code has been used
        created_at (datetime): Timestamp of creation
    """
    __tablename__ = 'pairing_code'

    _id = Column(
        'id',
        UUID(
            as_uuid=True),
        primary_key=True,
        default=uuid.uuid4)
    _code = Column('code', String(6), unique=True, nullable=False, index=True)
    _user_id = Column(
        'user_id', UUID(
            as_uuid=True), ForeignKey(
            'user.id', ondelete='CASCADE'), nullable=False)
    _caregiver_id = Column(
        'caregiver_id', UUID(
            as_uuid=True), ForeignKey(
            'caregiver.id', ondelete='CASCADE'), nullable=False)
    _expires_at = Column('expires_at', DateTime(timezone=True), nullable=False)
    _is_used = Column('is_used', Boolean, default=False, nullable=False)
    _created_at = Column(
        '_created_at', DateTime(
            timezone=True), default=lambda: datetime.now(
            timezone.utc), nullable=False)

    @property
    def id(self):
        """Get the pairing code's unique identifier.
        
        Returns:
            UUID: The pairing code's ID
        """
        return self._id

    @property
    def code(self) -> str:
        """Get the pairing code string.
        
        Returns:
            str: The 6-character pairing code
        """
        return self._code

    @code.setter
    def code(self, value: str):
        """Set the pairing code with validation.
        
        Args:
            value (str): The code to set (must be 6 characters)
            
        Raises:
            ValueError: If code is not exactly 6 characters
        """
        if not value or len(value) != 6:
            raise ValueError("Code must be exactly 6 characters")
        self._code = value.upper()

    @property
    def user_id(self):
        """Get the associated user ID.
        
        Returns:
            UUID: The user's ID
        """
        return self._user_id

    @user_id.setter
    def user_id(self, value):
        """Set the associated user ID.
        
        Args:
            value (UUID): The user's unique identifier
        """
        self._user_id = value

    @property
    def caregiver_id(self):
        """Get the associated caregiver ID.
        
        Returns:
            UUID: The caregiver's ID
        """
        return self._caregiver_id

    @caregiver_id.setter
    def caregiver_id(self, value):
        """Set the associated caregiver ID.
        
        Args:
            value (UUID): The caregiver's unique identifier
        """
        self._caregiver_id = value

    @property
    def expires_at(self) -> datetime:
        """Get the expiration timestamp.
        
        Returns:
            datetime: When this pairing code expires
        """
        return self._expires_at

    @expires_at.setter
    def expires_at(self, value: datetime):
        """Set the expiration timestamp.
        
        Args:
            value (datetime): The expiration datetime
        """
        self._expires_at = value

    @property
    def is_used(self) -> bool:
        """Get whether the code has been used.
        
        Returns:
            bool: True if code has been used, False otherwise
        """
        return self._is_used

    @is_used.setter
    def is_used(self, value: bool):
        """Set whether the code has been used.
        
        Args:
            value (bool): True to mark as used, False otherwise
        """
        self._is_used = value

    @property
    def created_at(self) -> datetime:
        """Get the creation timestamp.
        
        Returns:
            datetime: When this pairing code was created
        """
        return self._created_at

    def is_valid(self) -> bool:
        """Check if code is valid (not used and not expired).
        
        Returns:
            bool: True if code is still valid, False otherwise
        """
        return not self.is_used and datetime.now(
            timezone.utc) < self.expires_at
