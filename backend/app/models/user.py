import uuid
from datetime import datetime, timezone, date
from sqlalchemy import Column, String, DateTime, ARRAY, Date, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app import database

class UserModel(database):
    __tablename__ = 'user'
    _id = Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    _first_name = Column('first_name', String(100), nullable=False)
    _last_name = Column('last_name', String(100), nullable=False)
    _birthday = Column('birthday', Date, nullable=False)
    _caregiver_ids = Column('caregiver_ids', ARRAY(UUID(as_uuid=True), ForeignKey('caregiver.id')), default=list)
    _created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    _updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # ==================== Getter Setter ====================

    @property
    def id(self):
        return self._id

    @property
    def first_name(self) -> str:
        return self._first_name

    @first_name.setter
    def first_name(self, value: str) -> None:
        if (not value or len(value) > 100 or len(value.strip()) == 0):
            raise ValueError("First name is required and must be <= 100 chars")
        self._first_name = value.strip()

    @property
    def last_name(self) -> str:
        return self._last_name

    @last_name.setter
    def last_name(self, value: str) -> None:
        if (not value or len(value) > 100 or len(value.strip()) == 0):
            raise ValueError("last name is required and must be <= 100 chars")
        self._last_name = value.strip()

    @property
    def birthday(self) -> date:
        return self._birthday

    @birthday.setter
    def birthday(self, value) -> None:
        if isinstance(value, str):
            try:
                value = datetime.strptime(value, "%Y-%m-%d").date()
            except ValueError:
                raise ValueError("Birthday must be in YYYY-MM-DD format")
        
        if not isinstance(value, date):
            raise ValueError("Birthday must be a date object or string")
        
        if value > date.today():
            raise ValueError("Birthday cannot be in the future")
        
        today = date.today()
        age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))
        
        if age < 0:
            raise ValueError("Invalid birthday")
        if age > 150:
            raise ValueError("Birthday results in unrealistic age")
        self._birthday = value

    @property
    def caregiver_ids(self) -> list:
        return self._caregiver_ids or []

    @caregiver_ids.setter
    def caregiver_ids(self, value: list) -> None:
        self._caregiver_ids = value

    @property
    def created_at(self) -> datetime:
        return self._created_at

    @property
    def updated_at(self) -> datetime:
        return self._updated_at

    # ==================== object function ====================

    def add_caregiver(self, caregiver_id: uuid.UUID) -> None:
        """Ajoute un caregiver_id au tableau"""
        if self._caregiver_ids is None:
            self._caregiver_ids = []
        if caregiver_id not in self._caregiver_ids:
            self._caregiver_ids.append(caregiver_id)

    def remove_caregiver(self, caregiver_id: uuid.UUID) -> None:
        """Retire un caregiver_id du tableau"""
        if self._caregiver_ids and caregiver_id in self._caregiver_ids:
            self._caregiver_ids.remove(caregiver_id)

    def get_age(self) -> int:
        """Calcule l'âge actuel"""
        if not self._birthday:
            return None
        today = date.today()
        return today.year - self._birthday.year - ((today.month, today.day) < (self._birthday.month, self._birthday.day))
