import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy import Column, String, DateTime, ARRAY, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID
from app import database

class user(database):
    __tablename__ = 'caregiver'
    _id = Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    _title = Column('title', String(200), nullable=False)
    _description = Column('description', Text, nullable=True)
    _caregiver_id = Column('caregiver_ids', ARRAY(UUID(as_uuid=True)), default=list)
    _user_id = Column('caregiver_ids', ARRAY(UUID(as_uuid=True)), default=list)
    _created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    _updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

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

