import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy import Column, String, DateTime, ARRAY, Boolean, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app import database

class reminder_status(database):
    __tablename__ = 'reminder_status'
    _id = Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    _status = Column('status', String(15), nullable=False)
    _reminder_id = Column('reminder_id', UUID(as_uuid=True), ForeignKey('reminder.id'))
    _created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    _updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # ==================== Getter Setter ====================

    @property
    def id(self):
        return self._id

    @property
    def status(self):
        return self._status

    @status.setter
    def status(self, value):
        if (not value or len(value) > 200 or len(value.strip()) == 0):
            raise ValueError("status is required and must be <= 200 chars")
        self._status = value.strip()

    @property
    def reminder_id(self):
        return self._reminder_id

    @reminder_id.setter
    def reminder_id(self, value):
        self._reminder_id = value

    @property
    def created_at(self):
        return self._created_at

    @property
    def updated_at(self):
        return self._updated_at
