from typing import List
from uuid import UUID
from datetime import datetime
from app.models.reminder import ReminderModel
from app.persistence.base_repository import BaseRepository

class ReminderRepository(BaseRepository[ReminderModel]):
    def __init__(self):
        super().__init__(ReminderModel)

    def get_reminders_by_caregiver(self, caregiver_id: UUID) -> List[ReminderModel]:
        return self.db.query(self.model).filter(
            self.model._caregiver_id == caregiver_id
        ).order_by(self.model._scheduled_at.desc()).all()

    def get_reminders_by_user(self, user_id: UUID) -> List[ReminderModel]:
        return self.db.query(self.model).filter(
            self.model._user_id == user_id
        ).order_by(self.model._scheduled_at.desc()).all()

    def get_upcoming_reminders(self, user_id: UUID, limit: int = 5) -> List[ReminderModel]:
        return self.db.query(self.model).filter(
            self.model._user_id == user_id,
            self.model._scheduled_at >= datetime.now()
        ).order_by(self.model._scheduled_at.asc()).limit(limit).all()
