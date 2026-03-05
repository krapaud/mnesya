"""Reminder Status Schema module.

This module defines Pydantic schemas for ReminderStatus entity validation and serialization.
"""

from pydantic import BaseModel, Field, field_validator, ConfigDict
from datetime import datetime
from uuid import UUID
from typing import List, Optional
from app.models.reminder_status_enum import ReminderStatusEnum


class ReminderStatusCreate(BaseModel):
    """Schema for creating a new reminder status entry.

    Validates input data when creating a status via API.

    Attributes:
        status (str): The status value (must be: PENDING, DONE, POSTPONED, or UNABLE)
        reminder_id (UUID): ID of the reminder this status is for
    """

    status: str = Field(
        ..., description="Status value: PENDING, DONE, POSTPONED, or UNABLE"
    )
    reminder_id: UUID

    @field_validator("status")
    def validate_status(cls, value: str) -> str:
        """Validate and sanitize status field.

        Args:
            value (str): The status to validate

        Returns:
            str: Uppercase status value

        Raises:
            ValueError: If status is not a valid enum value
        """
        if not value or len(value.strip()) == 0:
            raise ValueError("Status is required")

        value_upper = value.strip().upper()
        if not ReminderStatusEnum.is_valid(value_upper):
            valid_statuses = ", ".join(ReminderStatusEnum.values())
            raise ValueError(f"Invalid status. Must be one of: {valid_statuses}")

        return value_upper


class ReminderStatusUpdate(BaseModel):
    """Schema for updating a reminder status.

    Note: In practice, we typically create new status entries rather than updating existing ones
    to maintain a complete history. This schema exists for completeness.

    Attributes:
        status (Optional[str]): Updated status value (must be: PENDING, DONE, POSTPONED, or UNABLE)
    """

    status: str = Field(
        ..., description="Status value: PENDING, DONE, POSTPONED, or UNABLE"
    )

    @field_validator("status")
    def validate_status(cls, value: str) -> str:
        """Validate and sanitize status if provided.

        Args:
            value (str): The status to validate

        Returns:
            str: Uppercase status value

        Raises:
            ValueError: If status is not a valid enum value
        """
        if not value or len(value.strip()) == 0:
            raise ValueError("Status is required")

        value_upper = value.strip().upper()
        if not ReminderStatusEnum.is_valid(value_upper):
            valid_statuses = ", ".join(ReminderStatusEnum.values())
            raise ValueError(f"Invalid status. Must be one of: {valid_statuses}")

        return value_upper


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

    # Enables ORM model conversion
    model_config = ConfigDict(from_attributes=True)


class ReminderStatusListResponse(BaseModel):
    """Schema for paginated reminder status list responses.

    Attributes:
        reminder_statuses (List[ReminderStatusResponse]): List of status objects
        total (int): Total count of status entries
    """

    reminder_statuses: List[ReminderStatusResponse]
    total: int


class ActivityLogEntry(BaseModel):
    """Schema for a single activity log entry in the caregiver dashboard.

    Each entry represents a user interaction on a reminder (DONE, POSTPONED,
    UNABLE or MISSED) that occurred in the last 48 hours.

    Attributes:
        status_id (UUID): Unique identifier of the status entry
        status (str): The interaction type (DONE, POSTPONED, UNABLE, MISSED)
        reminder_id (UUID): ID of the associated reminder
        reminder_title (str): Title of the reminder
        user_first_name (str): First name of the user who interacted
        user_last_name (str): Last name of the user who interacted
        occurred_at (datetime): When the interaction occurred
    """

    status_id: UUID
    status: str
    reminder_id: UUID
    reminder_title: str
    user_first_name: str
    user_last_name: str
    occurred_at: datetime

    model_config = ConfigDict(from_attributes=True)
