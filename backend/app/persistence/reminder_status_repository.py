"""Reminder Status Repository module.

This module provides data access operations specific to ReminderStatus
entities.
"""

from typing import List
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.reminder_status import ReminderStatusModel
from app.persistence.base_repository import BaseRepository


class ReminderStatusRepository(BaseRepository[ReminderStatusModel]):
    """Repository for ReminderStatus entity data access.

    Extends BaseRepository with status-specific query methods
    for tracking reminder state history.
    """

    def __init__(self, db: Session):
        """Initialize the ReminderStatusRepository with
        ReminderStatusModel and database session."""
        super().__init__(ReminderStatusModel, db)

    def get_statuses_by_reminder(
            self, reminder_id: UUID) -> List[ReminderStatusModel]:
        """Get all status entries for a specific reminder.

        Args:
            reminder_id (UUID): The reminder's unique identifier

        Returns:
            List[ReminderStatusModel]: List of status entries ordered
            by creation time (newest first)

        Note:
            Returns full history of status changes for the reminder
        """
        return self.db.query(self.model).filter(
            self.model._reminder_id == reminder_id
        ).order_by(self.model._created_at.desc()).all()

    def get_latest_status(self, reminder_id: UUID) -> ReminderStatusModel:
        """Get the most recent status for a reminder.

        Args:
            reminder_id (UUID): The reminder's unique identifier

        Returns:
            ReminderStatusModel: The latest status entry, or None if
            no status exists

        Note:
            Useful for determining current state without fetching full history
        """
        return self.db.query(self.model).filter(
            self.model._reminder_id == reminder_id
        ).order_by(self.model._created_at.desc()).first()
