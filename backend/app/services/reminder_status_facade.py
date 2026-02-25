"""Reminder Status Facade module.

This module implements the Facade pattern for ReminderStatus business logic.
It provides a simplified interface for tracking reminder state changes.
"""

from sqlalchemy.orm import Session
from app.models.reminder_status import ReminderStatusModel
from app.persistence.reminder_status_repository import ReminderStatusRepository


class ReminderStatusFacade:
    """Facade for ReminderStatus business logic operations.

    This class implements the Facade pattern to provide a clean interface
    for reminder status operations. It handles status tracking and coordinates
    between the model and repository layers.

    Attributes:
        reminder_status_repo (ReminderStatusRepository): Repository for status data access
    """
    def __init__(self, db: Session):
        """Initialize the facade with a reminder status repository."""
        self.reminder_status_repo = ReminderStatusRepository(db)

    # ==================== REMINDER STATUS BUSINESS LOGIC ====================

    def create_reminder_status(self, reminder_status_data: dict) -> object:
        """Create a new reminder status entry.

        Business logic for status creation. Creates a new status record
        to track state changes in a reminder's lifecycle.

        Args:
            reminder_status_data (dict): Dictionary containing status fields
                                         (status, reminder_id)

        Returns:
            ReminderStatusModel: The created status with generated ID and timestamps

        Raises:
            ValueError: If validation fails (from model setters)
            Exception: If database operation fails

        Note:
            Common status values: 'pending', 'completed', 'missed', 'cancelled'
        """
        reminder_status = ReminderStatusModel(**reminder_status_data)
        self.reminder_status_repo.add(reminder_status)
        return reminder_status

    def get_reminder_status(self, reminder_status_id: str) -> object:
        """Retrieve a reminder status by ID.

        Args:
            reminder_status_id (str): The status entry's unique identifier

        Returns:
            ReminderStatusModel: The status if found, None otherwise
        """
        return self.reminder_status_repo.get(reminder_status_id)

    def get_all_reminder_statuss(self) -> list:
        """Retrieve all reminder statuses.

        Returns:
            list[ReminderStatusModel]: List of all status entries in the system

        Warning:
            Use with caution on large datasets - consider pagination
            or use get_statuses_by_reminder for specific reminders
        """
        return self.reminder_status_repo.get_all()

    def update_reminder_status(
            self, reminder_status_id: str, reminder_status_data: dict) -> object:
        """Update an existing reminder status.

        Business logic for status updates. Only updates provided fields.

        Args:
            reminder_status_id (str): The status entry's unique identifier
            reminder_status_data (dict): Dictionary of fields to update

        Returns:
            ReminderStatusModel: The updated status if found, None otherwise

        Raises:
            ValueError: If validation fails (from model setters)
            Exception: If database operation fails

        Note:
            Consider creating a new status entry instead of updating
            to maintain full history
        """
        self.reminder_status_repo.update(
            reminder_status_id, reminder_status_data)
        return self.reminder_status_repo.get(reminder_status_id)

    def delete_reminder_status(self, reminder_status_id: str) -> bool:
        """Delete a reminder status entry.

        Args:
            reminder_status_id (str): The status entry's unique identifier

        Returns:
            bool: True if status was found and deleted, False if not found

        Raises:
            Exception: If database operation fails

        Warning:
            Deleting status entries removes historical tracking data
        """
        reminder_status = self.reminder_status_repo.get(reminder_status_id)
        if reminder_status:
            self.reminder_status_repo.delete(reminder_status_id)
            return True
        return False

    def get_statuses_by_reminder(self, reminder_id):
        """Get all status entries for a specific reminder.
        
        Args:
            reminder_id (UUID): The reminder's unique identifier
            
        Returns:
            List[ReminderStatusModel]: List of status entries ordered by creation time (newest first)
        """
        return self.reminder_status_repo.get_statuses_by_reminder(reminder_id)

    def get_latest_status(self, reminder_id):
        """Get the most recent status for a reminder.
        
        Args:
            reminder_id (UUID): The reminder's unique identifier
            
        Returns:
            ReminderStatusModel: The latest status entry, or None if no status exists
        """
        return self.reminder_status_repo.get_latest_status(reminder_id)
