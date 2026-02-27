"""Push Token model module.

This module defines the PushToken entity for storing Expo push notification tokens.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app import database


class PushTokenModel(database):
    """Push Token model for storing Expo push notification tokens.

    Attributes:
        id (UUID): Unique identifier for the token record
        token (str): The Expo push token (e.g., ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx])
        user_id (UUID): ID of the user who owns this token
        caregiver_id (UUID): ID of the caregiver who owns this token (nullable)
        device_name (str): Optional device name/description
        is_active (bool): Whether this token is currently active
        created_at (datetime): When the token was registered
        updated_at (datetime): When the token was last updated
    """
    __tablename__ = 'push_token'

    _id = Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    _token = Column('token', String(255), nullable=False, unique=True)
    _user_id = Column('user_id', UUID(as_uuid=True), ForeignKey('user.id'), nullable=True)
    _caregiver_id = Column('caregiver_id', UUID(as_uuid=True), ForeignKey('caregiver.id'), nullable=True)
    _device_name = Column('device_name', String(100), nullable=True)
    _locale = Column('locale', String(10), nullable=True)
    _is_active = Column('is_active', Boolean, default=True, nullable=False)
    _created_at = Column('created_at', DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    _updated_at = Column('updated_at', DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), 
                         onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # ==================== PROPERTIES ====================

    @property
    def id(self):
        """Get the token record's unique identifier."""
        return self._id

    @property
    def token(self) -> str:
        """Get the Expo push token."""
        return self._token

    @token.setter
    def token(self, value: str) -> None:
        """Set the Expo push token with validation."""
        if not value or len(value.strip()) == 0:
            raise ValueError("Push token is required")
        if len(value) > 255:
            raise ValueError("Push token must be <= 255 characters")
        if not value.startswith("ExponentPushToken["):
            raise ValueError("Invalid Expo push token format")
        self._token = value.strip()

    @property
    def user_id(self):
        """Get the user ID."""
        return self._user_id

    @user_id.setter
    def user_id(self, value) -> None:
        """Set the user ID."""
        self._user_id = value

    @property
    def caregiver_id(self):
        """Get the caregiver ID."""
        return self._caregiver_id

    @caregiver_id.setter
    def caregiver_id(self, value) -> None:
        """Set the caregiver ID."""
        self._caregiver_id = value

    @property
    def device_name(self) -> str:
        """Get the device name."""
        return self._device_name

    @device_name.setter
    def device_name(self, value: str) -> None:
        """Set the device name."""
        if value and len(value) > 100:
            raise ValueError("Device name must be <= 100 characters")
        self._device_name = value.strip() if value else None

    @property
    def locale(self) -> str:
        """Get the device locale (e.g. 'fr', 'en')."""
        return self._locale or 'fr'

    @locale.setter
    def locale(self, value: str) -> None:
        """Set the device locale."""
        self._locale = value.strip()[:10] if value else None

    @property
    def is_active(self) -> bool:
        """Get whether the token is active."""
        return self._is_active

    @is_active.setter
    def is_active(self, value: bool) -> None:
        """Set whether the token is active."""
        self._is_active = bool(value)

    @property
    def created_at(self) -> datetime:
        """Get the creation timestamp."""
        return self._created_at

    @property
    def updated_at(self) -> datetime:
        """Get the last update timestamp."""
        return self._updated_at
