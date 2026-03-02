"""Pairing API module.

This module provides endpoints for generating and verifying pairing codes.
Pairing codes allow users to connect their devices with their profiles.
"""

from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
import string
import random
from uuid import UUID

from app.schemas.pairing_code_schema import (
    PairingCodeCreate,
    PairingCodeResponse,
    PairingCodeVerify,
    PairingCodeVerifyResponse
)

from app.schemas.authentication_schema import TokenResponse

from app.persistence.pairing_code_repository import PairingCodeRepository
from app.persistence.user_repository import UserRepository
from app.api.authentication import verify_token, create_access_token
from app import get_db

ACCESS_TOKEN_EXPIRE_MINUTES = 60

router = APIRouter(prefix="/api/pairing", tags=["Pairing"])


def generate_pairing_code(length: int = 6) -> str:
    """Generate a random alphanumeric pairing code.
    
    Args:
        length (int): Length of the code (default: 6)
        
    Returns:
        str: Randomly generated uppercase alphanumeric code
    """
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choice(chars) for _ in range(length))


def get_current_caregiver_id(
        token_payload: dict = Depends(verify_token)) -> str:
    """Extract caregiver ID from JWT token payload."""
    caregiver_id = token_payload.get("sub")
    if not caregiver_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    return caregiver_id

@router.post(
    "/generate",
    response_model=PairingCodeResponse,
    summary="Generate pairing code",
    description="""
    Generate a new pairing code for a user profile.
    
    Creates a unique alphanumeric pairing code that allows an elderly person
    to pair their device with their profile. If an active (unexpired and unused)
    code already exists for this user, it will be returned instead of creating
    a new one.
    
    **Authentication required:** Bearer token (caregiver)
    
    **Code characteristics:**
    - 6 characters (uppercase letters and digits)
    - Unique across all codes
    - Valid for 5 minutes
    - Single use only
    
    **Access control:**
    - Caregiver must be associated with the user
    - Returns 403 Forbidden if access is denied
    
    **Use case:**
    Caregiver generates code and shares it with the elderly person,
    who enters it in their app to link their device to their profile.
    """,
    responses={
        200: {
            "description": "Pairing code generated successfully (or existing active code returned)",
            "content": {
                "application/json": {
                    "example": {
                        "code": "ABC123",
                        "expires_at": "2026-02-27T10:35:00Z"
                    }
                }
            }
        },
        400: {
            "description": "Bad request - Validation error",
            "content": {
                "application/json": {
                    "example": {"detail": "Invalid user_id format"}
                }
            }
        },
        401: {
            "description": "Unauthorized - Invalid or expired token",
            "content": {
                "application/json": {
                    "example": {"detail": "Could not validate credentials"}
                }
            }
        },
        403: {
            "description": "Forbidden - No access to this user",
            "content": {
                "application/json": {
                    "example": {"detail": "You don't have access to this user"}
                }
            }
        },
        404: {
            "description": "User not found",
            "content": {
                "application/json": {
                    "example": {"detail": "User not found"}
                }
            }
        }
    }
)
async def generate_code(
    request: PairingCodeCreate,
    caregiver_id: str = Depends(get_current_caregiver_id),
    db: Session = Depends(get_db)
):
    """Generate a pairing code for a user."""
    try:
        # Verify caregiver owns this user
        user_repo = UserRepository(db)
        user = user_repo.get(request.user_id)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        if UUID(caregiver_id) not in user.caregiver_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this user"
            )

        # Check if there's already an active code
        pairing_repo = PairingCodeRepository(db)
        existing_code = pairing_repo.find_active_by_user_id(request.user_id)

        if existing_code:
            return PairingCodeResponse(
                code=existing_code.code,
                expires_at=existing_code.expires_at
            )

        # Generate new code
        code = generate_pairing_code()
        while pairing_repo.find_by_code(code):  # Ensure uniqueness
            code = generate_pairing_code()

        # Create pairing code
        from app.models.pairing_code import PairingCodeModel
        pairing_code = PairingCodeModel()
        pairing_code.code = code
        pairing_code.user_id = request.user_id
        pairing_code.caregiver_id = UUID(caregiver_id)
        pairing_code.expires_at = datetime.now(
            timezone.utc) + timedelta(minutes=5)

        pairing_repo.add(pairing_code)

        return PairingCodeResponse(
            code=pairing_code.code,
            expires_at=pairing_code.expires_at
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post(
    "/verify",
    response_model=PairingCodeVerifyResponse,
    summary="Verify pairing code",
    description="""
    Verify a pairing code and authenticate the user.
    
    This endpoint is used by the elderly person's app to verify the pairing
    code provided by their caregiver. Upon successful verification:
    - The code is marked as used (single use)
    - User information is returned
    - A JWT access token is issued for the user
    
    **No authentication required** - This is the initial authentication endpoint
    
    **Verification checks:**
    - Code must exist in the system
    - Code must not be expired (valid for 5 minutes from generation)
    - Code must not have been used previously
    
    **What happens after verification:**
    1. Code is marked as used and cannot be reused
    2. User receives an access token for their session
    3. User's device is now paired with their profile
    
    **Token expiration:** 60 minutes
    
    **Use case:**
    Elderly person enters the code from their caregiver into their app,
    verifies it with this endpoint, and receives authentication to access
    their profile and reminders.
    """,
    responses={
        200: {
            "description": "Pairing code verified successfully, user authenticated",
            "content": {
                "application/json": {
                    "example": {
                        "user_id": "123e4567-e89b-12d3-a456-426614174000",
                        "user": {
                            "first_name": "Marie",
                            "last_name": "Dupont"
                        },
                        "caregiver_id": "987e6543-e89b-12d3-a456-426614174000",
                        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                        "token_type": "bearer",
                        "expires_in": 3600
                    }
                }
            }
        },
        400: {
            "description": "Bad request - Code expired or already used",
            "content": {
                "application/json": {
                    "example": {"detail": "Pairing code has expired or been used"}
                }
            }
        },
        404: {
            "description": "Pairing code not found",
            "content": {
                "application/json": {
                    "example": {"detail": "Invalid pairing code"}
                }
            }
        },
        500: {
            "description": "Internal server error",
            "content": {
                "application/json": {
                    "example": {"detail": "Login failed"}
                }
            }
        }
    }
)
async def verify_code(
    request: PairingCodeVerify,
    db: Session = Depends(get_db)
):
    """Verify a pairing code and return user info."""
    try:
        pairing_repo = PairingCodeRepository(db)
        pairing_code = pairing_repo.find_by_code(request.code)

        if not pairing_code:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invalid pairing code"
            )

        if not pairing_code.is_valid():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Pairing code has expired or been used"
            )

        # Mark code as used
        pairing_code.is_used = True
        pairing_repo.add(pairing_code)

        # Get user info
        user_repo = UserRepository(db)
        user = user_repo.get(pairing_code.user_id)

        # Generate JWT token for the user
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={
                "sub": str(user.id),
                "firstname": user.first_name,
                "lastname": user.last_name},
            expires_delta=access_token_expires
        )

        return PairingCodeVerifyResponse(
            user_id=user.id,
            user={
                "first_name": user.first_name,
                "last_name": user.last_name
            },
            caregiver_id=pairing_code.caregiver_id,
            access_token=access_token,
            token_type="bearer",
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )
