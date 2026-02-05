from pydantic import BaseModel, Field, field_validator
from datetime import datetime, date
from uuid import UUID
from typing import List, Optional
import validators

class CaregiverCreate(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email : str = Field(..., min_length=5, max_length=255)
    password : str = Field(..., min_length=8, max_length=255)

    @field_validator('first_name', 'last_name')
    def validate_name(cls, value: str) -> str:
        if (not value or len(value) > 100 or len(value.strip()) == 0):
            raise ValueError("Name is required and must be <= 100 chars")
        return value.strip()

    @field_validator('email')
    def validate_email(cls, value: str) -> str:
        if not validators.email(value):
            raise ValueError("email is required and a valid email")
        return value.strip()

    @field_validator('password')
    def validate_password(cls, value: str) -> str:
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
        return value.strip()

class CaregiverUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[str] = None
    password: Optional[str] = Field(None, min_length=8, max_length=255)

    @field_validator('first_name', 'last_name')
    def validate_name(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and (len(value) > 100 or len(value.strip()) == 0):
            raise ValueError("Name must be <= 100 chars and not empty")
        return value.strip() if value else None

    @field_validator('email')
    def validate_email(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and not validators.email(value):
            raise ValueError("Must be a valid email")
        return value.strip() if value else None

    @field_validator('password')
    def validate_password(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
            
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
        return value.strip()

class CaregiverResponse(BaseModel):
    id: UUID
    first_name: str
    last_name: str
    email : str
    password : str
    user_ids: List[UUID]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserListResponse(BaseModel):
    caregivers: List[CaregiverResponse]
    total: int
