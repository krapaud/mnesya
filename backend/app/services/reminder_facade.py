from app.models.reminder import ReminderModel
from app.persistence.reminder_repository import ReminderRepository

class ReminderFacade:
    """
    Facade pattern: Pure business logic layer
    Coordinates operations between models and repositories
    """
    def __init__(self):
        self.reminder_repo = ReminderRepository()

    # ==================== REMINDER BUSINESS LOGIC ====================

    def create_reminder(self, reminder_data: dict) -> object:
        """Business logic: Create a new reminder"""
        reminder = ReminderModel(**reminder_data)
        self.reminder_repo.add(reminder)
        return reminder

    def get_reminder(self, reminder_id: str) -> object:
        """Business logic: Retrieve a reminder by ID"""
        return self.reminder_repo.get(reminder_id)

    def get_all_reminders(self) -> list:
        """Business logic: Retrieve all reminders"""
        return self.reminder_repo.get_all()

    def update_reminder(self, reminder_id: str, reminder_data: dict) -> object:
        """Business logic: Update an existing reminder"""
        self.reminder_repo.update(reminder_id, reminder_data)
        return self.reminder_repo.get(reminder_id)

    def delete_reminder(self, reminder_id: str) -> bool:
        reminder = self.reminder_repo.get(reminder_id)
        if reminder:
            self.reminder_repo.delete(reminder_id)
            return True
        return False
