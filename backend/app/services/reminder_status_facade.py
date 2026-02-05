from app.models.reminder_status import ReminderStatusModel
from app.persistence.reminder_status_repository import ReminderStatusRepository

class ReminderStatusFacade:
    """
    Facade pattern: Pure business logic layer
    Coordinates operations between models and repositories
    """
    def __init__(self):
        self.reminder_status_repo = ReminderStatusRepository()

    # ==================== REMINDER STATUS BUSINESS LOGIC ====================

    def create_reminder_status(self, reminder_status_data: dict) -> object:
        """Business logic: Create a new reminder_status"""
        reminder_status = ReminderStatusModel(**reminder_status_data)
        self.reminder_status_repo.add(reminder_status)
        return reminder_status

    def get_reminder_status(self, reminder_status_id: str) -> object:
        """Business logic: Retrieve a reminder_status by ID"""
        return self.reminder_status_repo.get(reminder_status_id)

    def get_all_reminder_statuss(self) -> list:
        """Business logic: Retrieve all reminder_statuss"""
        return self.reminder_status_repo.get_all()

    def update_reminder_status(self, reminder_status_id: str, reminder_status_data: dict) -> object:
        """Business logic: Update an existing reminder_status"""
        self.reminder_status_repo.update(reminder_status_id, reminder_status_data)
        return self.reminder_status_repo.get(reminder_status_id)

    def delete_reminder_status(self, reminder_status_id: str) -> bool:
        reminder_status = self.reminder_status_repo.get(reminder_status_id)
        if reminder_status:
            self.reminder_status_repo.delete(reminder_status_id)
            return True
        return False
