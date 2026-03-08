"""Caregiver model module.

This module defines the Caregiver entity with authentication and user
management. Caregivers are responsible for managing and monitoring elderly
users.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from app import database
import validators
from passlib.hash import bcrypt


class CaregiverModel(database):
    """Caregiver model representing a care provider in the system.

    This model stores caregiver information including authentication
    credentials and relationships with users they care for.

    Attributes:
        id (UUID): Unique identifier for the caregiver
        first_name (str): Caregiver's first name (max 100 chars)
        last_name (str): Caregiver's last name (max 100 chars)
        email (str): Unique email address for login (max 255 chars)
        password (str): Hashed password (must meet security requirements)
        user_ids (list[UUID]): List of associated user IDs under care
        created_at (datetime): Timestamp of caregiver creation
        updated_at (datetime): Timestamp of last update
    """

    __tablename__ = "caregiver"
    _id = Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    _first_name = Column("first_name", String(100), nullable=False)
    _last_name = Column("last_name", String(100), nullable=False)
    _email = Column("email", String(255), unique=True, nullable=False, index=True)
    _password = Column("password", String(255), nullable=False)
    _user_ids = Column(
        "user_ids", ARRAY(UUID(as_uuid=True), ForeignKey("user.id")), default=list
    )
    _created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    _updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # ==================== Getter Setter ====================

    @property
    def id(self):
        """Get the caregiver's unique identifier.

        Returns:
            UUID: The caregiver's ID
        """
        return self._id

    @property
    def first_name(self) -> str:
        """Get the caregiver's first name.

        Returns:
            str: The caregiver's first name
        """
        return self._first_name

    @first_name.setter
    def first_name(self, value: str) -> None:
        """Set the caregiver's first name with validation.

        Args:
            value (str): The first name to set

        Raises:
            ValueError: If name is empty, only whitespace, or exceeds
                100 characters
        """
        if not value or len(value) > 100 or len(value.strip()) == 0:
            raise ValueError("First name is required and must be <= 100 chars")
        self._first_name = value.strip()

    @property
    def last_name(self) -> str:
        """Get the caregiver's last name.

        Returns:
            str: The caregiver's last name
        """
        return self._last_name

    @last_name.setter
    def last_name(self, value: str) -> None:
        """Set the caregiver's last name with validation.

        Args:
            value (str): The last name to set

        Raises:
            ValueError: If name is empty, only whitespace, or exceeds
                100 characters
        """
        if not value or len(value) > 100 or len(value.strip()) == 0:
            raise ValueError("last name is required and must be <= 100 chars")
        self._last_name = value.strip()

    @property
    def email(self) -> str:
        """Get the caregiver's email address.

        Returns:
            str: The caregiver's email
        """
        return self._email

    @email.setter
    def email(self, value: str) -> None:
        """Set the caregiver's email with validation.

        Args:
            value (str): The email address to set

        Raises:
            ValueError: If email format is invalid
        """
        value = value.strip()
        if not validators.email(value):
            raise ValueError("email is required and a valid email")
        self._email = value

    @property
    def password(self) -> str:
        """Get the caregiver's hashed password.

        Returns:
            str: The hashed password
        """
        return self._password

    @password.setter
    def password(self, value: str) -> None:
        """Set the caregiver's password with strict security validation.

        Password must meet the following requirements:
        - Length: 8-72 characters
        - At least one digit (0-9)
        - At least one uppercase letter (A-Z)
        - At least one lowercase letter (a-z)
        - At least one special character

        Args:
            value (str): The password to set (plaintext will be validated
            and hashed, bcrypt hash will be stored directly)

        Raises:
            ValueError: If password doesn't meet security requirements

        Note:
            If value is already a bcrypt hash (starts with $2a$ or $2b$),
            it will be stored directly without validation.
            Plaintext passwords will be validated and hashed automatically.
        """
        value = value.strip()

        SpecialSym = set("$@#%*!~&^()-_+=[]{}|;:,.<>?/\\")

        # Length validation (72 is bcrypt's effective max)
        if len(value) < 8:
            raise ValueError("Length should be at least 8")
        if len(value) > 72:
            raise ValueError("Length should not be greater than 72")

        # Check for required character types
        has_digit = has_upper = has_lower = has_sym = False

        for char in value:
            if 48 <= ord(char) <= 57:  # Check for digits (0-9)
                has_digit = True
            elif 65 <= ord(char) <= 90:  # Check for uppercase (A-Z)
                has_upper = True
            elif 97 <= ord(char) <= 122:  # Check for lowercase (a-z)
                has_lower = True
            elif char in SpecialSym:  # Check for special characters
                has_sym = True

        # Validate all requirements are met
        if not has_digit:
            raise ValueError("Password should have at least one numeral")
        if not has_upper:
            raise ValueError("Password should have at least one uppercase letter")
        if not has_lower:
            raise ValueError("Password should have at least one lowercase letter")
        if not has_sym:
            raise ValueError("Password should have at least one special character")

        # Hash the plaintext password before storing
        self._password = bcrypt.hash(value)

    @property
    def user_ids(self) -> list:
        """Get the list of user IDs under this caregiver's care.

        Returns:
            list[UUID]: List of user UUIDs, empty list if none
        """
        # Convert tuple to list if needed (SQLAlchemy returns tuples for ARRAY
        # columns)
        if self._user_ids is None:
            return []
        return (
            list(self._user_ids)
            if isinstance(self._user_ids, tuple)
            else self._user_ids
        )

    @user_ids.setter
    def user_ids(self, value: list) -> None:
        """Set the list of user IDs.

        Args:
            value (list[UUID]): List of user UUIDs
        """
        self._user_ids = value

    @property
    def created_at(self) -> datetime:
        """Get the creation timestamp.

        Returns:
            datetime: When this caregiver was created
        """
        return self._created_at

    @property
    def updated_at(self) -> datetime:
        """Get the last update timestamp.

        Returns:
            datetime: When this caregiver was last updated
        """
        return self._updated_at

    # ==================== Object function ====================

    def add_user(self, user_id: uuid.UUID) -> None:
        """Add a user to this caregiver's care list.

        Args:
            user_id (UUID): The user's unique identifier

        Note:
            Will not add duplicate IDs - user can only be added once
        """
        # Convert to list if it's a tuple (SQLAlchemy returns tuples for ARRAY
        # columns)
        if self._user_ids is None:
            self._user_ids = []
        elif isinstance(self._user_ids, tuple):
            self._user_ids = list(self._user_ids)

        if user_id not in self._user_ids:
            self._user_ids.append(user_id)

    def remove_user(self, user_id: uuid.UUID) -> None:
        """Remove a user from this caregiver's care list.

        Args:
            user_id (UUID): The user's unique identifier

        Note:
            Silently does nothing if user is not in the list
        """
        # Convert to list if it's a tuple (SQLAlchemy returns tuples for ARRAY
        # columns)
        if self._user_ids is not None and isinstance(self._user_ids, tuple):
            self._user_ids = list(self._user_ids)
        
        if self._user_ids and user_id in self._user_ids:
            self._user_ids.remove(user_id)

    def hash_password(self, password: str) -> None:
        """Hash a plaintext password using bcrypt and store it.

        Args:
            password (str): The plaintext password to hash
        """
        # Bypass the setter to avoid validation on the hash
        self._password = bcrypt.hash(password)

    def verify_password(self, password: str) -> bool:
        """Verify a plaintext password against the stored hash.

        Args:
            password (str): The plaintext password to verify

        Returns:
            bool: True if password matches, False otherwise
        """
        return bcrypt.verify(password, self.password)
