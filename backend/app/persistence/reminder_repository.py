"""Reminder Repository module.

This module provides data access operations specific to Reminder entities.
"""

from typing import List
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.reminder import ReminderModel
from app.models.user import UserModel
from app.persistence.base_repository import BaseRepository
from datetime import datetime, timedelta


class ReminderRepository(BaseRepository[ReminderModel]):
    """Repository for Reminder entity data access.

    Extends BaseRepository with reminder-specific query methods
    for filtering and ordering reminders by various criteria.
    """
    def __init__(self, db: Session):
        """Initialize the ReminderRepository with ReminderModel and database session."""
        super().__init__(ReminderModel, db)

    def get_reminders_by_caregiver(
            self, caregiver_id: UUID) -> List[ReminderModel]:
        """Get all reminders created by a specific caregiver, enriched with user name.

        Args:
            caregiver_id (UUID): The caregiver's unique identifier

        Returns:
            List[ReminderModel]: List of reminders ordered by scheduled time (newest first)
        """
        results = (
            self.db.query(self.model, UserModel._first_name, UserModel._last_name)
            .join(UserModel, self.model._user_id == UserModel._id)
            .filter(self.model._caregiver_id == caregiver_id)
            .order_by(self.model._scheduled_at.desc())
            .all()
        )
        for reminder, first_name, last_name in results:
            reminder.user_first_name = first_name
            reminder.user_last_name = last_name
        return [r for r, _, _ in results]

    def get_reminders_by_user(self, user_id: UUID) -> List[ReminderModel]:
        """Get all reminders for a specific user, enriched with user name.

        Args:
            user_id (UUID): The user's unique identifier

        Returns:
            List[ReminderModel]: List of reminders ordered by scheduled time (newest first)
        """
        results = (
            self.db.query(self.model, UserModel._first_name, UserModel._last_name)
            .join(UserModel, self.model._user_id == UserModel._id)
            .filter(self.model._user_id == user_id)
            .order_by(self.model._scheduled_at.desc())
            .all()
        )
        for reminder, first_name, last_name in results:
            reminder.user_first_name = first_name
            reminder.user_last_name = last_name
        return [r for r, _, _ in results]

    def get_upcoming_reminders(self, user_id: UUID, limit: int = 5) -> List[ReminderModel]:
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
            self.model._scheduled_at >= datetime.now()
        ).order_by(self.model._scheduled_at.asc()).limit(limit).all()

    def get_reminders_due_now(self, window_seconds: int = 60) -> List[ReminderModel]:
        now = datetime.utcnow()
        start = now - timedelta(seconds=window_seconds)
        return self.db.query(self.model).filter(
            self.model._scheduled_at >= start,
            self.model._scheduled_at <= now
        ).all()

    def get_reminders_at_offset(self, offset_minutes: int = 60, statuses: List[str] = None) -> List[ReminderModel]:
        now = datetime.utcnow()
        target = now - timedelta(minutes=offset_minutes)
        start = target - timedelta(seconds=30)
        end = target + timedelta(seconds=30)
        return self.db.query(self.model).filter(
            self.model._scheduled_at >= start,
            self.model._scheduled_at <= end
        ).all()

    def get_reminders_to_escalate(self, delay_minutes: int = 10) -> List[ReminderModel]:
        time_limit = datetime.utcnow() - timedelta(minutes=delay_minutes)
        return self.db.query(self.model).filter(
            self.model._scheduled_at <= time_limit
        ).all()
