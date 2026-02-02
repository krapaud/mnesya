import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy import Column, String, DateTime, ARRAY, Boolean, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app import database

class reminder(database):
    __tablename__ = 'reminder'
    _id = Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    _title = Column('title', String(200), nullable=False)
    _description = Column('description', Text, nullable=True)
    _caregiver_id = Column('caregiver_id', UUID(as_uuid=True), ForeignKey('caregiver.id'))
    _user_id = Column('user_id', UUID(as_uuid=True), ForeignKey('user.id'))
    _created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    _updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # ==================== Getter Setter ====================

    @property
    def id(self):
        return self._id

    @property
    def title(self):
        return self._title

    @title.setter
    def title(self, value):
        if (not value or len(value) > 200 or len(value.strip()) == 0):
            raise ValueError("Title is required and must be <= 200 chars")
        self._title = value.strip()

    @property
    def description(self):
        return self._description

    @description.setter
    def description(self, value):
        self._description = value

    @property
    def caregiver_id(self):
        return self._caregiver_id

    @caregiver_id.setter
    def caregiver_id(self, value):
        self._caregiver_id = value

    @property
    def user_id(self):
        return self._user_id

    @user_id.setter
    def user_id(self, value):
        self._user_id = value

    @property
    def created_at(self):
        return self._created_at

    @property
    def updated_at(self):
        return self._updated_at
