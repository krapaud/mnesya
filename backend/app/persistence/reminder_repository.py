"""Reminder Repository module.

This module provides data access operations specific to Reminder entities.
"""

from typing import List
from uuid import UUID
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.reminder import ReminderModel
from app.persistence.base_repository import BaseRepository


class ReminderRepository(BaseRepository[ReminderModel]):
    """Repository for Reminder entity data access.

    Extends BaseRepository with reminder-specific query methods
    for filtering and ordering reminders by various criteria.
    """
    def __init__(self, db: Session):
        """Initialize the ReminderRepository with ReminderModel and database session."""
        super().__init__(ReminderModel, db)

    def __init__(self, db: Session):
        """Initialize the ReminderRepository with ReminderModel and database session."""
        super().__init__(ReminderModel, db)

    def get_reminders_by_caregiver(
            self, caregiver_id: UUID) -> List[ReminderModel]:
        """Get all reminders created by a specific caregiver.

        Args:
            caregiver_id (UUID): The caregiver's unique identifier

        Returns:
            List[ReminderModel]: List of reminders ordered by scheduled time (newest first)
        """
        return self.db.query(self.model).filter(
            self.model._caregiver_id == caregiver_id
        ).order_by(self.model._scheduled_at.desc()).all()

    def get_reminders_by_user(self, user_id: UUID) -> List[ReminderModel]:
        """Get all reminders for a specific user.

        Args:
            user_id (UUID): The user's unique identifier

        Returns:
            List[ReminderModel]: List of reminders ordered by scheduled time (newest first)
        """
        return self.db.query(self.model).filter(
            self.model._user_id == user_id
        ).order_by(self.model._scheduled_at.desc()).all()

    def get_upcoming_reminders(self, user_id: UUID,
                               limit: int = 5) -> List[ReminderModel]:
        """Get upcoming reminders for a user.

        Args:
            user_id (UUID): The user's unique identifier
            limit (int): Maximum number of reminders to return (default: 5)

        Returns:
            List[ReminderModel]: List of future reminders ordered by scheduled time (soonest first)

        Note:
            Only returns reminders scheduled for current time or later
        """
        return self.db.query(self.model).filter(
            self.model._user_id == user_id,
            self.model._scheduled_at >= datetime.now()  # Only future reminders
        ).order_by(self.model._scheduled_at.asc()).limit(limit).all()
