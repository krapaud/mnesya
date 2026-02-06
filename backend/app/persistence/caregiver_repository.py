from typing import Optional
from app.models.caregiver import CaregiverModel
from app.persistence.base_repository import BaseRepository

class CaregiverRepository(BaseRepository[CaregiverModel]):
    def __init__(self):
        super().__init__(CaregiverModel)

    def get_caregiver_by_email(self, email: str) -> Optional[CaregiverModel]:
        return self.db.query(self.model).filter(self.model._email == email).first()

    def email_exists(self, email: str) -> bool:
        return self.db.query(self.model).filter(self.model._email == email).first() is not None
