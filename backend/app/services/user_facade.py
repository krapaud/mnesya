from app.models.user import UserModel
from app.persistence.user_repository import UserRepository

class UserFacade:
    """
    Facade pattern: Pure business logic layer
    Coordinates operations between models and repositories
    """
    def __init__(self):
        self.user_repo = UserRepository()

    # ==================== USER BUSINESS LOGIC ====================

    def create_user(self, user_data: dict) -> object:
        """Business logic: Create a new user"""
        user = UserModel(**user_data)
        self.user_repo.add(user)
        return user

    def get_user(self, user_id: str) -> object:
        """Business logic: Retrieve a user by ID"""
        return self.user_repo.get(user_id)

    def get_all_users(self) -> list:
        """Business logic: Retrieve all users"""
        return self.user_repo.get_all()

    def update_user(self, user_id: str, user_data: dict) -> object:
        """Business logic: Update an existing user"""
        self.user_repo.update(user_id, user_data)
        return self.user_repo.get(user_id)

    def delete_user(self, user_id: str) -> bool:
        user = self.user_repo.get(user_id)
        if user:
            self.user_repo.delete(user_id)
            return True
        return False
