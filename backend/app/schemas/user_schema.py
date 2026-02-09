"""User Schema module.

This module defines Pydantic schemas for User entity validation and serialization.
Schemas are used for API request/response validation and data transformation.
"""

from pydantic import BaseModel, Field, field_validator, ConfigDict
from datetime import datetime, date
from uuid import UUID
from typing import List, Optional

class UserCreate(BaseModel):
    """Schema for creating a new user.
    
    Validates input data when creating a user via API.
    
    Attributes:
        first_name (str): User's first name (1-100 chars)
        last_name (str): User's last name (1-100 chars)
        birthday (date): User's date of birth
    """
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    birthday: date

    @field_validator('first_name', 'last_name')
    def validate_name(cls, value: str) -> str:
        """Validate and sanitize name fields.
        
        Args:
            value (str): The name value to validate
            
        Returns:
            str: Trimmed name
            
        Raises:
            ValueError: If name is empty, only whitespace, or too long
        """
        if (not value or len(value) > 100 or len(value.strip()) == 0):
            raise ValueError("First name is required and must be <= 100 chars")
        return value.strip()

class UserUpdate(BaseModel):
    """Schema for updating an existing user.
    
    All fields are optional for partial updates.
    
    Attributes:
        first_name (Optional[str]): Updated first name (1-100 chars)
        last_name (Optional[str]): Updated last name (1-100 chars)
        birthday (Optional[date]): Updated date of birth
    """
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    birthday: Optional[date] = None

    @field_validator('first_name', 'last_name')
    def validate_name(cls, value: Optional[str]) -> Optional[str]:
        """Validate and sanitize name fields if provided.
        
        Args:
            value (Optional[str]): The name value to validate
            
        Returns:
            Optional[str]: Trimmed name or None
            
        Raises:
            ValueError: If name is only whitespace or too long
        """
        if (not value or len(value) > 100 or len(value.strip()) == 0):
            raise ValueError("First name is required and must be <= 100 chars")
        return value.strip() if value else None

class UserResponse(BaseModel):
    """Schema for user API responses.
    
    Used when returning user data from API endpoints.
    
    Attributes:
        id (UUID): User's unique identifier
        first_name (str): User's first name
        last_name (str): User's last name
        birthday (date): User's date of birth
        caregiver_ids (List[UUID]): List of associated caregiver IDs
        created_at (datetime): Creation timestamp
        updated_at (datetime): Last update timestamp
    """
    id: UUID
    first_name: str
    last_name: str
    birthday: date
    caregiver_ids: List[UUID]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)  # Enables ORM model conversion

class UserListResponse(BaseModel):
    """Schema for paginated user list responses.
    
    Attributes:
        users (List[UserResponse]): List of user objects
        total (int): Total count of users
    """
    users: List[UserResponse]
    total: int
