"""Reminder Repository module.

This module provides data access operations specific to Reminder entities.
"""

from typing import List
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.reminder import ReminderModel
from app.models.reminder_status import ReminderStatusModel
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

    def get_reminders_by_caregiver(self, caregiver_id: UUID) -> List[ReminderModel]:
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

    def get_upcoming_reminders(
        self, user_id: UUID, limit: int = 5
    ) -> List[ReminderModel]:
        """Get upcoming reminders for a user.

        Args:
            user_id (UUID): The user's unique identifier
            limit (int): Maximum number of reminders to return (default: 5)

        Returns:
            List[ReminderModel]: List of future reminders ordered by scheduled time (soonest first)

        Note:
            Only returns reminders scheduled for current time or later
        """
        return (
            self.db.query(self.model)
            .filter(
                self.model._user_id == user_id,
                self.model._scheduled_at >= datetime.now(),
            )
            .order_by(self.model._scheduled_at.asc())
            .limit(limit)
            .all()
        )

    def get_reminders_due_now(self, window_seconds: int = 60) -> List[ReminderModel]:
        """Get reminders that are due within the current time window.

        Excludes reminders with a terminal status (DONE, UNABLE, MISSED) to avoid
        re-sending notifications after the user has responded definitively.

        POSTPONED is intentionally NOT excluded: postponing a reminder moves its
        scheduled_at forward, so it must fire again at the new scheduled time.

        Args:
            window_seconds (int): Size of the time window in seconds. Defaults to 60.

        Returns:
            List[ReminderModel]: Reminders whose scheduled_at falls between
            (now - window_seconds) and now, with no terminal status yet.
        """
        now = datetime.utcnow()
        start = now - timedelta(seconds=window_seconds)

        # POSTPONED is intentionally excluded from this list: a postponed reminder
        # has its scheduled_at moved forward and must fire again at the new time.
        # Only truly terminal statuses (DONE, UNABLE, MISSED) prevent re-firing.
        resolved_ids = self.db.query(ReminderStatusModel._reminder_id).filter(
            ReminderStatusModel._status.in_(["DONE", "UNABLE", "MISSED"])
        )

        return (
            self.db.query(self.model)
            .filter(
                self.model._scheduled_at >= start,
                self.model._scheduled_at <= now,
                ~self.model._id.in_(resolved_ids),
            )
            .all()
        )

    def get_reminders_at_offset(
        self, offset_minutes: int = 60, statuses: List[str] = None
    ) -> List[ReminderModel]:
        """Get reminders scheduled exactly offset_minutes ago (±30 seconds).

        Used for retry logic: finds reminders whose scheduled_at was
        approximately offset_minutes ago and have not yet been responded to.
        Excludes reminders with a terminal status (DONE, POSTPONED, UNABLE, MISSED)
        to avoid re-notifying users who already responded.

        Args:
            offset_minutes (int): Target offset in minutes from now. Defaults to 60.
            statuses (List[str]): Unused — kept for API compatibility.

        Returns:
            List[ReminderModel]: Unresolved reminders within the ±30s window around the target time.
        """
        now = datetime.utcnow()
        target = now - timedelta(minutes=offset_minutes)
        start = target - timedelta(seconds=30)
        end = target + timedelta(seconds=30)

        resolved_ids = self.db.query(ReminderStatusModel._reminder_id).filter(
            ReminderStatusModel._status.in_(["DONE", "POSTPONED", "UNABLE", "MISSED"])
        )

        return (
            self.db.query(self.model)
            .filter(
                self.model._scheduled_at >= start,
                self.model._scheduled_at <= end,
                ~self.model._id.in_(resolved_ids),
            )
            .all()
        )

    def get_reminders_to_escalate(self, delay_minutes: int = 10) -> List[ReminderModel]:
        """Get reminders that should be escalated to the caregiver.

        Returns all reminders older than delay_minutes that have never been
        resolved (DONE, POSTPONED, UNABLE or MISSED). Using a range instead of a strict
        window makes the query resilient to worker restarts: any reminder missed
        during a downtime will be caught on the next run.

        Args:
            delay_minutes (int): Minimum age in minutes to trigger escalation. Defaults to 10.

        Returns:
            List[ReminderModel]: Reminders past the escalation threshold.
        """
        now = datetime.utcnow()
        escalate_after = now - timedelta(minutes=delay_minutes)
        escalate_before = now - timedelta(hours=24)  # ignore reminders older than 24h

        # Subquery: reminder IDs that have already been responded to or missed
        resolved_ids = self.db.query(ReminderStatusModel._reminder_id).filter(
            ReminderStatusModel._status.in_(["DONE", "POSTPONED", "UNABLE", "MISSED"])
        )

        # Return all unresolved reminders past the escalation threshold (within last 24h)
        results = (
            self.db.query(self.model, UserModel._first_name, UserModel._last_name)
            .join(UserModel, self.model._user_id == UserModel._id)
            .filter(
                self.model._scheduled_at <= escalate_after,
                self.model._scheduled_at >= escalate_before,
                ~self.model._id.in_(resolved_ids),
            )
            .all()
        )
        for reminder, first_name, last_name in results:
            reminder.user_first_name = first_name
            reminder.user_last_name = last_name
        return [r for r, _, _ in results]
