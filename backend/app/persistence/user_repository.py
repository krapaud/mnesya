from typing import List
from uuid import UUID
from app.models.user import UserModel
from app.persistence.base_repository import BaseRepository

class UserRepository(BaseRepository[UserModel]):
    def __init__(self):
        super().__init__(UserModel)

    def get_users_by_caregiver(self, caregiver_id: UUID) -> List[UserModel]:
        return self.db.query(self.model).filter(
            self.model._caregiver_ids.contains([caregiver_id])
        ).all()
