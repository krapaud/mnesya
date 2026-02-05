from pydantic import BaseModel, Field, field_validator
from datetime import datetime, date
from uuid import UUID
from typing import List, Optional

class UserCreate(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    birthday: date

    @field_validator('first_name', 'last_name')
    def validate_name(cls, value: str) -> str:
        if (not value or len(value) > 100 or len(value.strip()) == 0):
            raise ValueError("First name is required and must be <= 100 chars")
        return value.strip()

class UserUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    birthday: Optional[date] = None

    @field_validator('first_name', 'last_name')
    def validate_name(cls, value: Optional[str]) -> Optional[str]:
        if (not value or len(value) > 100 or len(value.strip()) == 0):
            raise ValueError("First name is required and must be <= 100 chars")
        return value.strip() if value else None

class UserResponse(BaseModel):
    id: UUID
    first_name: str
    last_name: str
    birthday: date
    caregiver_ids: List[UUID]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserListResponse(BaseModel):
    users: List[UserResponse]
    total: int
