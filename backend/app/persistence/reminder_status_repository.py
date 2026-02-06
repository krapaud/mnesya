from typing import List
from uuid import UUID
from app.models.reminder_status import ReminderStatusModel
from app.persistence.base_repository import BaseRepository

class ReminderStatusRepository(BaseRepository[ReminderStatusModel]):
    def __init__(self):
        super().__init__(ReminderStatusModel)

    def get_statuses_by_reminder(self, reminder_id: UUID) -> List[ReminderStatusModel]:
        return self.db.query(self.model).filter(
            self.model._reminder_id == reminder_id
        ).order_by(self.model._created_at.desc()).all()

    def get_latest_status(self, reminder_id: UUID) -> ReminderStatusModel:
        return self.db.query(self.model).filter(
            self.model._reminder_id == reminder_id
        ).order_by(self.model._created_at.desc()).first()
