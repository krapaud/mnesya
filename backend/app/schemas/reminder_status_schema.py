"""Reminder Status Schema module.

This module defines Pydantic schemas for ReminderStatus entity validation and serialization.
"""

from pydantic import BaseModel, Field, field_validator, ConfigDict
from datetime import datetime
from uuid import UUID
from typing import List, Optional

class ReminderStatusCreate(BaseModel):
    """Schema for creating a new reminder status entry.
    
    Validates input data when creating a status via API.
    
    Attributes:
        status (str): The status value (1-15 chars, e.g., 'pending', 'completed')
        reminder_id (UUID): ID of the reminder this status is for
    """
    status: str = Field(..., min_length=1, max_length=15)
    reminder_id: UUID

    @field_validator('status')
    def validate_status(cls, value: str) -> str:
        """Validate and sanitize status field.
        
        Args:
            value (str): The status to validate
            
        Returns:
            str: Trimmed status
            
        Raises:
            ValueError: If status is empty, only whitespace, or too long
        """
        if not value or len(value) > 15 or len(value.strip()) == 0:
            raise ValueError("Status is required and must be <= 15 chars")
        return value.strip()


class ReminderStatusUpdate(BaseModel):
    """Schema for updating an existing reminder status.
    
    All fields are optional for partial updates.
    
    Attributes:
        status (Optional[str]): Updated status value (1-15 chars)
        reminder_id (Optional[UUID]): Updated reminder ID
    """
    status: Optional[str] = Field(None, min_length=1, max_length=15)
    reminder_id: Optional[UUID] = None

    @field_validator('status')
    def validate_status(cls, value: Optional[str]) -> Optional[str]:
        """Validate and sanitize status if provided.
        
        Args:
            value (Optional[str]): The status to validate
            
        Returns:
            Optional[str]: Trimmed status or None
            
        Raises:
            ValueError: If status is only whitespace or too long
        """
        if value is not None and (len(value) > 15 or len(value.strip()) == 0):
            raise ValueError("Status must be <= 15 chars and not empty")
        return value.strip() if value else None


class ReminderStatusResponse(BaseModel):
    """Schema for reminder status API responses.
    
    Used when returning status data from API endpoints.
    
    Attributes:
        id (UUID): Status entry's unique identifier
        status (str): The status value
        reminder_id (UUID): ID of the associated reminder
        created_at (datetime): Creation timestamp
        updated_at (datetime): Last update timestamp
    """
    id: UUID
    status: str
    reminder_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)  # Enables ORM model conversion


class ReminderStatusListResponse(BaseModel):
    """Schema for paginated reminder status list responses.
    
    Attributes:
        reminder_statuses (List[ReminderStatusResponse]): List of status objects
        total (int): Total count of status entries
    """
    reminder_statuses: List[ReminderStatusResponse]
    total: int
