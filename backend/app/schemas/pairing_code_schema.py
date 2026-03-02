"""Pairing Code Schema module.

This module defines Pydantic schemas for pairing code operations.
Pairing codes enable users to connect their devices with their profiles.
"""

from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID
from typing import Optional


class PairingCodeCreate(BaseModel):
    """Schema for creating a pairing code.
    
    Attributes:
        user_id (UUID): ID of the user to create pairing code for
    """
    user_id: UUID


class PairingCodeResponse(BaseModel):
    """Schema for pairing code response.
    
    Attributes:
        code (str): The 6-character pairing code
        expires_at (datetime): When the code expires
    """
    code: str = Field(..., min_length=6, max_length=6)
    expires_at: datetime


class PairingCodeVerify(BaseModel):
    """Schema for verifying a pairing code.
    
    Attributes:
        code (str): The 6-character pairing code to verify
    """
    code: str = Field(..., min_length=6, max_length=6)


class UserInfo(BaseModel):
    """Schema for user information in pairing code verification.
    
    Attributes:
        first_name (str): User's first name
        last_name (str): User's last name
    """
    first_name: str
    last_name: str


class PairingCodeVerifyResponse(BaseModel):
    """Schema for pairing code verification response.
    
    Attributes:
        user_id (UUID): ID of the verified user
        user (UserInfo): User's information
        caregiver_id (UUID): ID of the associated caregiver
        access_token (str): JWT access token for authentication
        token_type (str): Token type (default: "bearer")
        expires_in (int): Token expiration time in seconds (default: 3600)
    """
    user_id: UUID
    user: UserInfo
    caregiver_id: UUID
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 3600
