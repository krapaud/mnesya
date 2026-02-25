"""Reminder Status model module.

This module defines the ReminderStatus entity for tracking reminder state changes.
Each status entry represents a state change in a reminder's lifecycle.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app import database
from app.models.reminder_status_enum import ReminderStatusEnum


class ReminderStatusModel(database):
    """Reminder Status model representing the state of a reminder.

    This model tracks the status history of reminders, allowing
    multiple status entries per reminder (e.g., pending, completed, missed).

    Attributes:
        id (UUID): Unique identifier for this status entry
        status (str): The status value (max 15 chars, e.g., 'pending', 'completed')
        reminder_id (UUID): ID of the associated reminder
        created_at (datetime): Timestamp when this status was set
        updated_at (datetime): Timestamp of last update
    """
    __tablename__ = 'reminder_status'
    _id = Column(
        'id',
        UUID(
            as_uuid=True),
        primary_key=True,
        default=uuid.uuid4)
    _status = Column('status', String(15), nullable=False)
    _reminder_id = Column(
        'reminder_id',
        UUID(
            as_uuid=True),
        ForeignKey('reminder.id'))
    _created_at = Column(
        DateTime(
            timezone=True), default=lambda: datetime.now(
            timezone.utc), nullable=False)
    _updated_at = Column(
        DateTime(
            timezone=True), default=lambda: datetime.now(
            timezone.utc), onupdate=lambda: datetime.now(
                timezone.utc), nullable=False)

    # ==================== Getter Setter ====================

    @property
    def id(self):
        """Get the status entry's unique identifier.

        Returns:
            UUID: The status entry's ID
        """
        return self._id

    @property
    def status(self) -> str:
        """Get the status value.

        Returns:
            str: The status string (e.g., 'pending', 'completed', 'missed')
        """
        return self._status

    @status.setter
    def status(self, value: str) -> None:
        """Set the status value with validation.

        Args:
            value (str): The status to set (must be one of: PENDING, DONE, POSTPONED, UNABLE)

        Raises:
            ValueError: If status is invalid or not in allowed values

        Note:
            Valid status values: PENDING, DONE, POSTPONED, UNABLE
        """
        if not value or len(value.strip()) == 0:
            raise ValueError("Status is required")
        
        value_upper = value.strip().upper()
        if not ReminderStatusEnum.is_valid(value_upper):
            valid_statuses = ", ".join(ReminderStatusEnum.values())
            raise ValueError(f"Invalid status. Must be one of: {valid_statuses}")
        
        self._status = value_upper

    @property
    def reminder_id(self) -> uuid.UUID:
        """Get the ID of the associated reminder.

        Returns:
            UUID: The reminder's ID
        """
        return self._reminder_id

    @reminder_id.setter
    def reminder_id(self, value: uuid.UUID) -> None:
        """Set the reminder ID.

        Args:
            value (UUID): The reminder's unique identifier
        """
        self._reminder_id = value

    @property
    def created_at(self) -> datetime:
        """Get the creation timestamp.

        Returns:
            datetime: When this status entry was created
        """
        return self._created_at

    @property
    def updated_at(self) -> datetime:
        """Get the last update timestamp.

        Returns:
            datetime: When this status entry was last updated
        """
        return self._updated_at
