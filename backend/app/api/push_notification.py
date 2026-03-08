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


@router.post(
    "/register",
    response_model=PushTokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register push notification token",
    description="""
    Register a device's push notification token for receiving notifications.
    
    This endpoint registers a device's Expo push notification token, allowing
    the system to send push notifications to this device. If the token already
    exists, it will be updated with the new information.
    
    **Authentication required:** Bearer token (caregiver or user)
    
    **Required fields:**
    - token: Expo push token (format: ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx])
    - device_name: Device identifier (e.g., "iPhone 13", "Pixel 6")
    
    **Optional fields:**
    - user_id: UUID of the user (for user devices)
    - caregiver_id: UUID of the caregiver (for caregiver devices)
    
    **Behavior:**
    - If token exists: Updates device_name and reactivates the token
    - If token is new: Creates a new token record
    - Automatically associates with authenticated user/caregiver if IDs not provided
    
    **Use cases:**
    - Register device on app launch
    - Update token after app reinstall
    - Reactivate token for returning users
    """,
    responses={
        201: {
            "description": "Push token registered successfully",
            "content": {
                "application/json": {
                    "example": {
                        "id": "123e4567-e89b-12d3-a456-426614174000",
                        "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
                        "user_id": "456e7890-e89b-12d3-a456-426614174000",
                        "caregiver_id": "987e6543-e89b-12d3-a456-426614174000",
                        "device_name": "iPhone 13",
                        "is_active": True,
                        "created_at": "2026-02-27T10:30:00Z"
                    }
                }
            }
        },
        400: {
            "description": "Bad request - Validation error",
            "content": {
                "application/json": {
                    "example": {"detail": "Invalid token format"}
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
        500: {
            "description": "Internal server error",
            "content": {
                "application/json": {
                    "example": {"detail": "Failed to register push token"}
                }
            }
        }
    }
)
async def register_push_token(
    token_data: PushTokenCreate,
    token_payload: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Register a new push notification token.

    Detects whether the caller is a caregiver (JWT contains "email") or a user
    (JWT contains "firstname") and assigns the token to the correct field.

    Args:
        token_data: Push token information
        token_payload: Decoded JWT payload
        db: Database session

    Returns:
        PushTokenResponse: The registered token
    """
    try:
        repo = PushTokenRepository(db)
        caller_id = UUID(token_payload.get("sub"))
        is_caregiver = "email" in token_payload

        # Check if token already exists
        existing = repo.get_by_token(token_data.token)
        if existing:
            # Update existing token
            existing.is_active = True
            existing.device_name = token_data.device_name
            if token_data.user_id:
                existing.user_id = token_data.user_id
            elif not is_caregiver:
                existing.user_id = caller_id
            if token_data.caregiver_id:
                existing.caregiver_id = token_data.caregiver_id
            elif is_caregiver:
                existing.caregiver_id = caller_id
            db.commit()
            db.refresh(existing)
            return existing

        # Create new token
        push_token = PushTokenModel()
        push_token.token = token_data.token
        push_token.device_name = token_data.device_name
        if is_caregiver:
            push_token.caregiver_id = token_data.caregiver_id or caller_id
            push_token.user_id = token_data.user_id
        else:
            push_token.user_id = token_data.user_id or caller_id
            push_token.caregiver_id = token_data.caregiver_id

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


@router.delete(
    "/unregister",
    summary="Unregister push notification token",
    description="""
    Remove a push notification token from the system.
    
    Use this endpoint to unregister a device's push notification token,
    typically when:
    - User logs out
    - App is uninstalled
    - User disables notifications
    - Device is no longer in use
    
    **Authentication required:** Bearer token (caregiver or user)
    
    **Query parameters:**
    - token: The push token to unregister (URL encoded)
    
    After unregistration, the device will no longer receive push notifications
    until it registers again.
    
    **Note:** This permanently deletes the token record. To temporarily disable
    notifications, you may want to implement a deactivation feature instead.
    """,
    responses={
        200: {
            "description": "Push token unregistered successfully",
            "content": {
                "application/json": {
                    "example": {"message": "Push token unregistered successfully"}
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
        404: {
            "description": "Push token not found",
            "content": {
                "application/json": {
                    "example": {"detail": "Push token not found"}
                }
            }
        },
        500: {
            "description": "Internal server error",
            "content": {
                "application/json": {
                    "example": {"detail": "Failed to unregister push token"}
                }
            }
        }
    }
)
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


@router.get(
    "/my-tokens",
    response_model=List[PushTokenResponse],
    summary="Get my push notification tokens",
    description="""
    Retrieve all active push notification tokens for the authenticated user.
    
    Returns a list of all devices registered to receive push notifications
    for the authenticated caregiver or user. Useful for:
    - Displaying registered devices in settings
    - Managing multiple devices
    - Debugging notification delivery issues
    
    **Authentication required:** Bearer token (caregiver or user)
    
    **Search logic:**
    1. First attempts to find tokens as caregiver
    2. If no caregiver tokens found, searches as user
    3. Returns empty list if no tokens found
    
    **Response includes:**
    - Token ID and value
    - Device name
    - Associated user/caregiver IDs
    - Registration timestamp
    - Active status
    """,
    responses={
        200: {
            "description": "List of push tokens retrieved successfully",
            "content": {
                "application/json": {
                    "example": [
                        {
                            "id": "123e4567-e89b-12d3-a456-426614174000",
                            "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
                            "user_id": "456e7890-e89b-12d3-a456-426614174000",
                            "caregiver_id": "987e6543-e89b-12d3-a456-426614174000",
                            "device_name": "iPhone 13",
                            "is_active": True,
                            "created_at": "2026-02-27T10:30:00Z"
                        },
                        {
                            "id": "223e4567-e89b-12d3-a456-426614174001",
                            "token": "ExponentPushToken[yyyyyyyyyyyyyyyyyyyyyy]",
                            "user_id": "456e7890-e89b-12d3-a456-426614174000",
                            "caregiver_id": "987e6543-e89b-12d3-a456-426614174000",
                            "device_name": "iPad Pro",
                            "is_active": True,
                            "created_at": "2026-02-26T15:20:00Z"
                        }
                    ]
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
        500: {
            "description": "Internal server error",
            "content": {
                "application/json": {
                    "example": {"detail": "Failed to retrieve push tokens"}
                }
            }
        }
    }
)
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