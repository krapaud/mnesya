"""Reminder Status Repository module.

This module provides data access operations specific to ReminderStatus
entities.
"""

from typing import List
from uuid import UUID
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models.reminder_status import ReminderStatusModel
from app.models.reminder import ReminderModel
from app.models.user import UserModel
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

    def get_statuses_by_reminder(self, reminder_id: UUID) -> List[ReminderStatusModel]:
        """Get all status entries for a specific reminder.

        Args:
            reminder_id (UUID): The reminder's unique identifier

        Returns:
            List[ReminderStatusModel]: List of status entries ordered
            by creation time (newest first)

        Note:
            Returns full history of status changes for the reminder
        """
        return (
            self.db.query(self.model)
            .filter(self.model._reminder_id == reminder_id)
            .order_by(self.model._created_at.desc())
            .all()
        )

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
        return (
            self.db.query(self.model)
            .filter(self.model._reminder_id == reminder_id)
            .order_by(self.model._created_at.desc())
            .first()
        )

    def get_recent_activity_by_caregiver(
        self, caregiver_id: UUID, hours: int = 48
    ) -> List[ReminderStatusModel]:
        """Get all user-interaction statuses across all reminders of a caregiver
        over the last `hours` hours.

        Only returns meaningful interaction statuses: DONE, POSTPONED, UNABLE,
        MISSED. PENDING is excluded as it is set automatically, not by the user.

        Each returned object is enriched with `reminder_title`, `user_first_name`
        and `user_last_name` for display purposes.

        Args:
            caregiver_id (UUID): The caregiver's unique identifier.
            hours (int): Time window in hours. Defaults to 48.

        Returns:
            List[ReminderStatusModel]: Status entries ordered newest first,
            enriched with reminder and user data.
        """
        since = datetime.now(timezone.utc) - timedelta(hours=hours)
        interaction_statuses = ["DONE", "POSTPONED", "UNABLE", "MISSED"]

        results = (
            self.db.query(
                self.model,
                ReminderModel._title,
                UserModel._first_name,
                UserModel._last_name,
            )
            .join(ReminderModel, self.model._reminder_id == ReminderModel._id)
            .join(UserModel, ReminderModel._user_id == UserModel._id)
            .filter(
                ReminderModel._caregiver_id == caregiver_id,
                self.model._status.in_(interaction_statuses),
                self.model._created_at >= since,
            )
            .order_by(self.model._created_at.desc())
            .all()
        )

        for status_entry, title, first_name, last_name in results:
            status_entry.reminder_title = title
            status_entry.user_first_name = first_name
            status_entry.user_last_name = last_name

        return [s for s, _, _, _ in results]
