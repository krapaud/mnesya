"""Reminder Schema module.

This module defines Pydantic schemas for Reminder entity validation and serialization.
"""

from pydantic import BaseModel, Field, field_validator, ConfigDict
from datetime import datetime
from uuid import UUID
from typing import List, Optional

class ReminderCreate(BaseModel):
    """Schema for creating a new reminder.
    
    Validates input data when creating a reminder via API.
    
    Attributes:
        title (str): Brief description (1-200 chars)
        description (Optional[str]): Detailed description (optional)
        scheduled_at (datetime): When the reminder should trigger
        caregiver_id (UUID): ID of caregiver creating the reminder
        user_id (UUID): ID of user this reminder is for
    """
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    scheduled_at: datetime
    user_id: UUID

    @field_validator('title')
    def validate_title(cls, value: str) -> str:
        """Validate and sanitize title field.
        
        Args:
            value (str): The title to validate
            
        Returns:
            str: Trimmed title
            
        Raises:
            ValueError: If title is empty, only whitespace, or too long
        """
        if not value or len(value) > 200 or len(value.strip()) == 0:
            raise ValueError("Title is required and must be <= 200 chars")
        return value.strip()


class ReminderUpdate(BaseModel):
    """Schema for updating an existing reminder.
    
    All fields are optional for partial updates.
    
    Attributes:
        title (Optional[str]): Updated title (1-200 chars)
        description (Optional[str]): Updated description
        scheduled_at (Optional[datetime]): Updated scheduled time
        caregiver_id (Optional[UUID]): Updated caregiver ID
        user_id (Optional[UUID]): Updated user ID
    """
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    caregiver_id: Optional[UUID] = None
    user_id: Optional[UUID] = None

    @field_validator('title')
    def validate_title(cls, value: Optional[str]) -> Optional[str]:
        """Validate and sanitize title if provided.
        
        Args:
            value (Optional[str]): The title to validate
            
        Returns:
            Optional[str]: Trimmed title or None
            
        Raises:
            ValueError: If title is only whitespace or too long
        """
        if value is not None and (len(value) > 200 or len(value.strip()) == 0):
            raise ValueError("Title must be <= 200 chars and not empty")
        return value.strip() if value else None


class ReminderResponse(BaseModel):
    """Schema for reminder API responses.
    
    Used when returning reminder data from API endpoints.
    
    Attributes:
        id (UUID): Reminder's unique identifier
        title (str): Reminder title
        description (Optional[str]): Detailed description (may be None)
        scheduled_at (datetime): Scheduled trigger time
        caregiver_id (UUID): ID of caregiver who created it
        user_id (UUID): ID of user it's for
        created_at (datetime): Creation timestamp
        updated_at (datetime): Last update timestamp
    """
    id: UUID
    title: str
    description: Optional[str]
    scheduled_at: datetime
    caregiver_id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)  # Enables ORM model conversion


class ReminderListResponse(BaseModel):
    """Schema for paginated reminder list responses.
    
    Attributes:
        reminders (List[ReminderResponse]): List of reminder objects
        total (int): Total count of reminders
    """
    reminders: List[ReminderResponse]
    total: int
