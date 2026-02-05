import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app import database

class ReminderModel(database):
    __tablename__ = 'reminder'
    _id = Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    _title = Column('title', String(200), nullable=False)
    _description = Column('description', Text, nullable=True)
    _scheduled_at = Column('scheduled_at', DateTime(timezone=True), nullable=False)
    _caregiver_id = Column('caregiver_id', UUID(as_uuid=True), ForeignKey('caregiver.id'))
    _user_id = Column('user_id', UUID(as_uuid=True), ForeignKey('user.id'))
    _created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    _updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # ==================== Getter Setter ====================

    @property
    def id(self):
        return self._id

    @property
    def title(self) -> str:
        return self._title

    @title.setter
    def title(self, value: str) -> None:
        if (not value or len(value) > 200 or len(value.strip()) == 0):
            raise ValueError("Title is required and must be <= 200 chars")
        self._title = value.strip()

    @property
    def description(self) -> str:
        return self._description

    @description.setter
    def description(self, value: str) -> None:
        self._description = value

    @property
    def scheduled_at(self) -> datetime:
        return self._scheduled_at

    @scheduled_at.setter
    def scheduled_at(self, value: datetime) -> None:
        if isinstance(value, str):
            try:
                value = datetime.fromisoformat(value.replace('Z', '+00:00'))
            except ValueError:
                raise ValueError("scheduled_at must be a valid ISO datetime format")
        
        if not isinstance(value, datetime):
            raise ValueError("scheduled_at must be a datetime object or ISO string")
        
        self._scheduled_at = value

    @property
    def caregiver_id(self) -> uuid.UUID:
        return self._caregiver_id

    @caregiver_id.setter
    def caregiver_id(self, value: uuid.UUID) -> None:
        self._caregiver_id = value

    @property
    def user_id(self) -> uuid.UUID:
        return self._user_id

    @user_id.setter
    def user_id(self, value: uuid.UUID) -> None:
        self._user_id = value

    @property
    def created_at(self) -> datetime:
        return self._created_at

    @property
    def updated_at(self) -> datetime:
        return self._updated_at
