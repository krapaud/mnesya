"""Reminder Repository module.

This module provides data access operations specific to Reminder entities.
"""

from typing import List
from uuid import UUID
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from app.models.reminder import ReminderModel
from app.models.user import UserModel
from app.persistence.base_repository import BaseRepository
from sqlalchemy import func
from app.models.reminder_status import ReminderStatusModel
from app.models.reminder_status_enum import ReminderStatusEnum


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

    def get_reminders_due_now(self, window_seconds: int = 60) -> List[ReminderModel]:
        """Reminders due in the last `window_seconds` seconds, still PENDING."""

        now = datetime.now(timezone.utc)
        window_start = now - timedelta(seconds=window_seconds)

        # Subquery: get latest status per reminder (explicit labels to avoid key conflicts)
        latest = (
            self.db.query(
                ReminderStatusModel._reminder_id.label("rid"),
                func.max(ReminderStatusModel._created_at).label("max_created")
            )
            .group_by(ReminderStatusModel._reminder_id)
            .subquery()
        )

        return (
            self.db.query(self.model)
            .join(latest, self.model._id == latest.c.rid)
            .join(ReminderStatusModel, (ReminderStatusModel._reminder_id == self.model._id) &
                  (ReminderStatusModel._created_at == latest.c.max_created))
            .filter(
                self.model._scheduled_at >= window_start,
                self.model._scheduled_at <= now,
                ReminderStatusModel._status == ReminderStatusEnum.PENDING.value
            )
            .all()
        )

    def get_reminders_at_offset(self, offset_minutes: int, statuses: List[str]) -> List[ReminderModel]:
        """Reminders whose scheduled_at was `offset_minutes` ago, with one of the given statuses.

        Used for retry logic: find reminders that fired X minutes ago but still have no final response.

        Args:
            offset_minutes: How many minutes after scheduled_at to check (e.g. 2, 5).
            statuses: List of status values to match (e.g. [PENDING]).

        Returns:
            List[ReminderModel]: Reminders matching the criteria.
        """
        now = datetime.now(timezone.utc)
        window_start = now - timedelta(minutes=offset_minutes + 1)
        window_end = now - timedelta(minutes=offset_minutes)

        latest = (
            self.db.query(
                ReminderStatusModel._reminder_id.label("rid"),
                func.max(ReminderStatusModel._created_at).label("max_created")
            )
            .group_by(ReminderStatusModel._reminder_id)
            .subquery()
        )

        return (
            self.db.query(self.model)
            .join(latest, self.model._id == latest.c.rid)
            .join(ReminderStatusModel, (ReminderStatusModel._reminder_id == self.model._id) &
                  (ReminderStatusModel._created_at == latest.c.max_created))
            .filter(
                self.model._scheduled_at >= window_start,
                self.model._scheduled_at <= window_end,
                ReminderStatusModel._status.in_(statuses)
            )
            .all()
        )

    def get_reminders_to_escalate(self, delay_minutes: int = 10) -> List[ReminderModel]:
        """Reminders due `delay_minutes` ago that are still PENDING (no user response)."""
        now = datetime.now(timezone.utc)
        escalate_start = now - timedelta(minutes=delay_minutes + 1)
        escalate_end = now - timedelta(minutes=delay_minutes)

        latest = (
            self.db.query(
                ReminderStatusModel._reminder_id.label("rid"),
                func.max(ReminderStatusModel._created_at).label("max_created")
            )
            .group_by(ReminderStatusModel._reminder_id)
            .subquery()
        )

        return (
            self.db.query(self.model)
            .join(latest, self.model._id == latest.c.rid)
            .join(ReminderStatusModel, (ReminderStatusModel._reminder_id == self.model._id) &
                  (ReminderStatusModel._created_at == latest.c.max_created))
            .filter(
                self.model._scheduled_at >= escalate_start,
                self.model._scheduled_at <= escalate_end,
                ReminderStatusModel._status.in_([
                    ReminderStatusEnum.PENDING.value,
                    ReminderStatusEnum.POSTPONED.value
                ])
            )
            .all()
        )
