"""Pairing API module."""

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
    """Generate a random alphanumeric pairing code."""
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choice(chars) for _ in range(length))

@router.post("/generate", response_model=PairingCodeResponse)
async def generate_code(
    request: PairingCodeCreate,
    caregiver_id: str = Depends(lambda token=Depends(verify_token): token.get("sub")),
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
        pairing_code.expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)
        
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

@router.post("/verify", response_model=PairingCodeVerifyResponse)
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
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        from app.schemas.pairing_code_schema import UserInfo
        return PairingCodeVerifyResponse(
            user_id=user.id,
            user=UserInfo(
                first_name=user.first_name,
                last_name=user.last_name
            ),
            caregiver_id=pairing_code.caregiver_id
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )
