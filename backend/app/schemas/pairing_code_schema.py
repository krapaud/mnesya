"""Pairing Code Schema module."""

from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID

class PairingCodeCreate(BaseModel):
    """Schema for creating a pairing code."""
    user_id: UUID
    caregiver_id: UUID

class PairingCodeResponse(BaseModel):
    """Schema for pairing code response."""
    code: str = Field(..., min_length=6, max_length=6)
    expires_at: datetime

class PairingCodeVerify(BaseModel):
    """Schema for verifying a pairing code."""
    code: str = Field(..., min_length=6, max_length=6)

class PairingCodeVerifyResponse(BaseModel):
    """Schema for pairing code verification response."""
    user_id: UUID
    user_first_name: str
    user_last_name: str
    caregiver_id: UUID