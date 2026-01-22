import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from app import database
import validators

class caregiver(database):
    __tablename__ = 'caregiver'
    _id = Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    _first_name = Column('first_name', String(100), nullable=False)
    _last_name = Column('last_name', String(100), nullable=False)
    _email = Column('email', String(255), unique=True, nullable=False, index=True)
    _password = Column('password', String(255), nullable=False)
    _user_ids = Column('user_ids', ARRAY(UUID(as_uuid=True)), default=list)
    _created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    _updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    @property
    def id(self):
        return self._id

    @property
    def first_name(self):
        return self._first_name

    @first_name.setter
    def first_name(self, value):
        if (not value or len(value) > 100 or len(value.strip()) == 0):
            raise ValueError("First name is required and must be <= 100 chars")
        self._first_name = value.strip()

    @property
    def last_name(self):
        return self._last_name

    @last_name.setter
    def last_name(self, value):
        if (not value or len(value) > 100 or len(value.strip()) == 0):
            raise ValueError("last name is required and must be <= 100 chars")
        self._last_name = value.strip()

    @property
    def email(self):
        return self._email

    @email.setter
    def email(self, value):
        if not validators.email(value):
            raise ValueError("email is required and a valid email")
        self._email = value

    @property
    def password(self):
        return self._password

    @password.setter
    def password(self, value):
        SpecialSym = ['$', '@', '#', '%', '*', '!', '~', '&']

        if len(value) < 8:
            raise ValueError('Length should be at least 8')
        if len(value) > 20:
            raise ValueError('Length should not be greater than 20')

        has_digit = has_upper = has_lower = has_sym = False

        for char in value:
            if 48 <= ord(char) <= 57:
                has_digit = True
            elif 65 <= ord(char) <= 90:
                has_upper = True
            elif 97 <= ord(char) <= 122:
                has_lower = True
            elif char in SpecialSym:
                has_sym = True

        if not has_digit:
            raise ValueError('Password should have at least one numeral')
        if not has_upper:
            raise ValueError('Password should have at least one uppercase letter')
        if not has_lower:
            raise ValueError('Password should have at least one lowercase letter')
        if not has_sym:
            raise ValueError('Password should have at least one of the symbols $@#%*!~&')
        self._password = value

    @property
    def user_ids(self):
        return self._user_ids or []

    @user_ids.setter
    def user_ids(self, value):
        self._user_ids = value

    @property
    def created_at(self):
        return self._created_at

    @property
    def uptated_at(self):
        return self._updated_at

    def add_user(self, user_id: uuid.UUID):
        """Ajoute un user_id au tableau"""
        if self._user_ids is None:
            self._user_ids = []
        if user_id not in self._user_ids:
            self._user_ids.append(user_id)

    def remove_user(self, user_id: uuid.UUID):
        """Retire un user_id du tableau"""
        if self._user_ids and user_id in self._user_ids:
            self._user_ids.remove(user_id)
