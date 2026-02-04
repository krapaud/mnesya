from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from uuid import UUID
from typing import List, Optional

class ReminderCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    caregiver_id: UUID
    user_id: UUID

    @field_validator('title')
    def validate_title(cls, value):
        if not value or len(value) > 200 or len(value.strip()) == 0:
            raise ValueError("Title is required and must be <= 200 chars")
        return value.strip()


class ReminderUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    caregiver_id: Optional[UUID] = None
    user_id: Optional[UUID] = None
    
    @field_validator('title')
    def validate_title(cls, value):
        if value is not None and (len(value) > 200 or len(value.strip()) == 0):
            raise ValueError("Title must be <= 200 chars and not empty")
        return value.strip() if value else None


class ReminderResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    caregiver_id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ReminderListResponse(BaseModel):
    reminders: List[ReminderResponse]
    total: int
