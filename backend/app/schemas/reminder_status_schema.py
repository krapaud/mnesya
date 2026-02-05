from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from uuid import UUID
from typing import List, Optional

class ReminderStatusCreate(BaseModel):
    status: str = Field(..., min_length=1, max_length=15)
    reminder_id: UUID

    @field_validator('status')
    def validate_status(cls, value: str) -> str:
        if not value or len(value) > 15 or len(value.strip()) == 0:
            raise ValueError("Status is required and must be <= 15 chars")
        return value.strip()


class ReminderStatusUpdate(BaseModel):
    status: Optional[str] = Field(None, min_length=1, max_length=15)
    reminder_id: Optional[UUID] = None

    @field_validator('status')
    def validate_status(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and (len(value) > 15 or len(value.strip()) == 0):
            raise ValueError("Status must be <= 15 chars and not empty")
        return value.strip() if value else None


class ReminderStatusResponse(BaseModel):
    id: UUID
    status: str
    reminder_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ReminderStatusListResponse(BaseModel):
    reminder_statuses: List[ReminderStatusResponse]
    total: int
