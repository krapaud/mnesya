"""Push Notification API module.

This module provides endpoints for managing push notification tokens.
"""

from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from app import get_db
from app.api.authentication import verify_token
from app.models.push_token import PushTokenModel
from app.persistence.push_token_repository import PushTokenRepository
from app.schemas.push_token_schema import (
    PushTokenCreate,
    PushTokenResponse,
    PushTokenDelete
)
from typing import List
from uuid import UUID

router = APIRouter(prefix="/api/push-tokens", tags=["Push Notifications"])


@router.post("/register", response_model=PushTokenResponse, status_code=status.HTTP_201_CREATED)
async def register_push_token(
    token_data: PushTokenCreate,
    user_id: str = Depends(lambda token=Depends(verify_token): token.get("sub")),
    db: Session = Depends(get_db)
):
    """Register a new push notification token.
    
    Args:
        token_data: Push token information
        user_id: Authenticated user/caregiver ID from JWT
        db: Database session
        
    Returns:
        PushTokenResponse: The registered token
    """
    try:
        repo = PushTokenRepository(db)
        
        # Check if token already exists
        existing = repo.get_by_token(token_data.token)
        if existing:
            # Update existing token
            existing.is_active = True
            existing.device_name = token_data.device_name
            if token_data.user_id:
                existing.user_id = token_data.user_id
            if token_data.caregiver_id:
                existing.caregiver_id = token_data.caregiver_id
            db.commit()
            db.refresh(existing)
            return existing
        
        # Create new token
        push_token = PushTokenModel()
        push_token.token = token_data.token
        push_token.user_id = token_data.user_id
        push_token.caregiver_id = token_data.caregiver_id or UUID(user_id)
        push_token.device_name = token_data.device_name
        
        repo.add(push_token)
        return push_token
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to register push token: {str(e)}"
        )


@router.delete("/unregister")
async def unregister_push_token(
    token: str,
    user_id: str = Depends(lambda token=Depends(verify_token): token.get("sub")),
    db: Session = Depends(get_db)
):
    """Unregister (delete) a push notification token.
    
    Args:
        token: Token information to delete
        user_id: Authenticated user/caregiver ID from JWT
        db: Database session
        
    Returns:
        Success message
    """
    try:
        repo = PushTokenRepository(db)
        deleted = repo.delete_by_token(token)
        
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Push token not found"
            )
        
        return {"message": "Push token unregistered successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to unregister push token: {str(e)}"
        )


@router.get("/my-tokens", response_model=List[PushTokenResponse])
async def get_my_tokens(
    user_id: str = Depends(lambda token=Depends(verify_token): token.get("sub")),
    db: Session = Depends(get_db)
):
    """Get all push tokens for the authenticated user/caregiver.
    
    Args:
        user_id: Authenticated user/caregiver ID from JWT
        db: Database session
        
    Returns:
        List of push tokens
    """
    try:
        repo = PushTokenRepository(db)
        
        # Try to get as caregiver first
        tokens = repo.get_active_tokens_by_caregiver(UUID(user_id))
        
        # If no caregiver tokens, try as user
        if not tokens:
            tokens = repo.get_active_tokens_by_user(UUID(user_id))
        
        return tokens
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve push tokens: {str(e)}"
        )


__all__ = ["router"]