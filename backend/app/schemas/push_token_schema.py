"""Push Token Schema module.

This module defines Pydantic schemas for PushToken validation and serialization.
"""

from pydantic import BaseModel, Field, field_validator, ConfigDict
from datetime import datetime
from uuid import UUID
from typing import Optional


class PushTokenCreate(BaseModel):
    """Schema for creating a new push token.
    
    Attributes:
        token (str): Expo push token (format: ExponentPushToken[...])
        user_id (Optional[UUID]): User ID for elderly user app
        caregiver_id (Optional[UUID]): Caregiver ID for caregiver app
        device_name (Optional[str]): Device name or description
    """
    
    token: str = Field(..., description="Expo push token")
    user_id: Optional[UUID] = Field(None, description="User ID (for elderly user app)")
    caregiver_id: Optional[UUID] = Field(None, description="Caregiver ID (for caregiver app)")
    device_name: Optional[str] = Field(None, description="Device name/description")

    @field_validator('token')
    def validate_token(cls, value: str) -> str:
        """Validate Expo push token format."""
        if not value or len(value.strip()) == 0:
            raise ValueError("Push token is required")
        if not value.startswith("ExponentPushToken["):
            raise ValueError("Invalid Expo push token format")
        return value.strip()

    @field_validator('device_name')
    def validate_device_name(cls, value: Optional[str]) -> Optional[str]:
        """Validate device name."""
        if value and len(value) > 100:
            raise ValueError("Device name must be <= 100 characters")
        return value.strip() if value else None


class PushTokenResponse(BaseModel):
    """Schema for push token API responses.
    
    Attributes:
        id (UUID): Token record's unique identifier
        token (str): The Expo push token
        user_id (Optional[UUID]): Associated user ID
        caregiver_id (Optional[UUID]): Associated caregiver ID
        device_name (Optional[str]): Device name
        is_active (bool): Whether the token is active
        created_at (datetime): When the token was registered
        updated_at (datetime): When the token was last updated
    """
    
    id: UUID
    token: str
    user_id: Optional[UUID]
    caregiver_id: Optional[UUID]
    device_name: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PushTokenDelete(BaseModel):
    """Schema for deleting a push token.
    
    Attributes:
        token (str): Expo push token to delete
    """
    
    token: str = Field(..., description="Expo push token to delete")


class SendNotificationRequest(BaseModel):
    """Schema for sending a test notification.
    
    Attributes:
        title (str): Notification title
        body (str): Notification message body
        data (Optional[dict]): Optional extra data payload
    """
    
    title: str = Field(..., description="Notification title")
    body: str = Field(..., description="Notification message")
    data: Optional[dict] = Field(None, description="Optional extra data")