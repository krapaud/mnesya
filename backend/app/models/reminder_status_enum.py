"""Reminder Status Enum module.

This module defines the possible status values for reminders.
"""

from enum import Enum


class ReminderStatusEnum(str, Enum):
    """Enumeration of possible reminder statuses.
    
    Attributes:
        PENDING: Reminder is scheduled and waiting to be completed
        DONE: Reminder has been completed successfully
        POSTPONED: Reminder has been postponed to a later time
        UNABLE: User was unable to complete the reminder
    """
    PENDING = "PENDING"
    DONE = "DONE"
    POSTPONED = "POSTPONED"
    UNABLE = "UNABLE"
    
    @classmethod
    def values(cls):
        """Get all valid status values.
        
        Returns:
            list[str]: List of all status values
        """
        return [status.value for status in cls]
    
    @classmethod
    def is_valid(cls, value: str) -> bool:
        """Check if a value is a valid status.
        
        Args:
            value (str): The value to check
            
        Returns:
            bool: True if valid, False otherwise
        """
        return value in cls.values()
