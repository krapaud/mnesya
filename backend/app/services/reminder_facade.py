"""Reminder Facade module.

This module implements the Facade pattern for Reminder business logic.
It provides a simplified interface for reminder operations.
"""

from sqlalchemy.orm import Session
from app.models.reminder import ReminderModel
from app.models.reminder_status import ReminderStatusModel
from app.models.reminder_status_enum import ReminderStatusEnum
from app.persistence.reminder_repository import ReminderRepository
from app.persistence.reminder_status_repository import ReminderStatusRepository
from uuid import UUID


class ReminderFacade:
    """Facade for Reminder business logic operations.

    This class implements the Facade pattern to provide a clean interface
    for reminder-related operations. It handles business logic and coordinates
    between the model and repository layers.

    Attributes:
        reminder_repo (ReminderRepository): Repository for reminder data access
        reminder_status_repo (ReminderStatusRepository): Repository for
            status data access
    """
    def __init__(self, db: Session):
        """Initialize the facade with reminder and status repositories."""
        self.reminder_repo = ReminderRepository(db)
        self.reminder_status_repo = ReminderStatusRepository(db)

    # ==================== REMINDER BUSINESS LOGIC ====================

    def create_reminder(self, reminder_data: dict) -> object:
        """Create a new reminder with an initial PENDING status.

        Business logic for reminder creation. Validates data through the
        model's property setters, persists to the database, and automatically
        creates a PENDING status entry.

        Args:
            reminder_data (dict): Dictionary containing reminder fields
                (title, description, scheduled_at, caregiver_id, user_id)

        Returns:
            ReminderModel: The created reminder with generated ID and
                timestamps

        Raises:
            ValueError: If validation fails (from model setters)
            Exception: If database operation fails
        """
        # Create the reminder
        reminder = ReminderModel(**reminder_data)
        self.reminder_repo.add(reminder)

        # Automatically create initial PENDING status
        initial_status = ReminderStatusModel()
        initial_status.status = ReminderStatusEnum.PENDING.value
        initial_status.reminder_id = reminder.id
        self.reminder_status_repo.add(initial_status)

        return reminder

    def get_reminder(self, reminder_id: str) -> object:
        """Retrieve a reminder by ID.

        Args:
            reminder_id (str): The reminder's unique identifier

        Returns:
            ReminderModel: The reminder if found, None otherwise
        """
        return self.reminder_repo.get(UUID(reminder_id))

    def get_all_reminders(self) -> list:
        """Retrieve all reminders.

        Returns:
            list[ReminderModel]: List of all reminders in the system

        Warning:
            Use with caution on large datasets - consider pagination
            or use specific query methods (by_caregiver, by_user)
        """
        return self.reminder_repo.get_all()

    def get_reminder_by_caregiver(self, caregiver_id: UUID) -> list:
        return self.reminder_repo.get_reminders_by_caregiver(caregiver_id)

    def get_reminder_by_user(self, user_id: UUID) -> list:
        return self.reminder_repo.get_reminders_by_user(user_id)

    def update_reminder(self, reminder_id: str, reminder_data: dict) -> object:
        """Update an existing reminder.

        Business logic for reminder updates. Only updates provided fields.

        Args:
            reminder_id (str): The reminder's unique identifier
            reminder_data (dict): Dictionary of fields to update

        Returns:
            ReminderModel: The updated reminder if found, None otherwise

        Raises:
            ValueError: If validation fails (from model setters)
            Exception: If database operation fails
        """
        self.reminder_repo.update(UUID(reminder_id), reminder_data)
        return self.reminder_repo.get(UUID(reminder_id))

    def postpone_reminder(self, reminder_id: str, delay_minutes: int = 5) -> object:
        """Postpone a reminder by a given number of minutes.

        Updates the reminder's scheduled_at to now + delay_minutes
        and creates a POSTPONED status entry.

        Args:
            reminder_id (str): The reminder's unique identifier
            delay_minutes (int): Number of minutes to postpone. Defaults to 5.

        Returns:
            ReminderModel: The updated reminder, or None if not found
        """
        from datetime import datetime, timedelta
        reminder = self.reminder_repo.get(UUID(reminder_id))
        if not reminder:
            return None

        new_scheduled_at = datetime.utcnow() + timedelta(minutes=delay_minutes)
        self.reminder_repo.update(UUID(reminder_id), {"scheduled_at": new_scheduled_at})

        postponed_status = ReminderStatusModel()
        postponed_status.status = ReminderStatusEnum.POSTPONED.value
        postponed_status.reminder_id = reminder.id
        self.reminder_status_repo.add(postponed_status)

        return self.reminder_repo.get(UUID(reminder_id))

    def delete_reminder(self, reminder_id: str) -> bool:
        """Delete a reminder and its associated statuses.

        Args:
            reminder_id (str): The reminder's unique identifier

        Returns:
            bool: True if reminder was found and deleted, False if not found

        Raises:
            Exception: If database operation fails
        """
        reminder = self.reminder_repo.get(UUID(reminder_id))
        if reminder:
            # Delete associated statuses first to avoid FK constraint violation
            statuses = self.reminder_status_repo.get_statuses_by_reminder(
                reminder.id
            )
            for status in statuses:
                self.reminder_status_repo.delete(status.id)
            self.reminder_repo.delete(UUID(reminder_id))
            return True
        return False
