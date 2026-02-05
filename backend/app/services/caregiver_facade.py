from app.models.caregiver import CaregiverModel
from app.persistence.caregiver_repository import CaregiverRepository

class CaregiverFacade:
    """
    Facade pattern: Pure business logic layer
    Coordinates operations between models and repositories
    """
    def __init__(self):
        self.caregiver_repo = CaregiverRepository()

    # ==================== CAREGIVER BUSINESS LOGIC ====================

    def create_caregiver(self, caregiver_data: dict) -> object:
        """Business logic: Create a new caregiver"""
        caregiver = CaregiverModel(**caregiver_data)
        caregiver.hash_password(caregiver_data['password'])
        self.caregiver_repo.add(caregiver)
        return caregiver

    def get_caregiver(self, caregiver_id: str) -> object:
        """Business logic: Retrieve a caregiver by ID"""
        return self.caregiver_repo.get(caregiver_id)

    def get_caregiver_by_email(self, email: str) -> object:
        """Business logic: Retrieve a caregiver by email"""
        return self.caregiver_repo.get_caregiver_by_email(email)

    def get_all_caregivers(self) -> list:
        """Business logic: Retrieve all caregivers"""
        return self.caregiver_repo.get_all()

    def update_caregiver(self, caregiver_id: str, caregiver_data: dict) -> object:
        """Business logic: Update an existing caregiver"""
        self.caregiver_repo.update(caregiver_id, caregiver_data)
        return self.caregiver_repo.get(caregiver_id)

    def delete_caregiver(self, caregiver_id: str) -> bool:
        caregiver = self.caregiver_repo.get(caregiver_id)
        if caregiver:
            self.caregiver_repo.delete(caregiver_id)
            return True
        return False
