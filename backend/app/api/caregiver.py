"""Caregiver Profile API module.

This module provides endpoints for managing caregiver profiles.
Caregivers can view and update their own profile information.
"""

from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from uuid import UUID
from app.services.caregiver_facade import CaregiverFacade
from app.schemas.caregiver_schema import CaregiverUpdate, CaregiverResponse
from app.api.authentication import verify_token
from app import get_db

# Router
router = APIRouter(prefix="/api/caregivers", tags=["Caregivers"])


def get_caregiver_facade(db: Session = Depends(get_db)) -> CaregiverFacade:
    """Dependency to create CaregiverFacade instance with database session."""
    return CaregiverFacade(db)


def get_current_caregiver_id(
        token_payload: dict = Depends(verify_token)) -> str:
    """Extract caregiver ID from JWT token.

    Args:
        token_payload (dict): Decoded JWT token

    Returns:
        str: Caregiver ID

    Raises:
        HTTPException: If token is invalid
    """
    caregiver_id = token_payload.get("sub")
    if not caregiver_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )
    return caregiver_id


@router.put(
    "/me",
    response_model=CaregiverResponse,
    summary="Update caregiver profile",
    description="""
    Update the authenticated caregiver's profile information.
    
    Supports partial updates - only the fields you provide will be updated.
    Other fields will remain unchanged.
    
    **Authentication required:** Bearer token (caregiver)
    
    **Updatable fields:**
    - First name
    - Last name
    - Email address
    - Password (requires current_password)
    
    **Password change:**
    - Must provide current_password to change password
    - New password will be securely hashed
    - Password must meet minimum requirements (8+ characters)
    
    **Email change:**
    - New email must be unique in the system
    - Returns 409 Conflict if email already exists
    """,
    responses={
        200: {
            "description": "Caregiver profile updated successfully",
            "content": {
                "application/json": {
                    "example": {
                        "id": "123e4567-e89b-12d3-a456-426614174000",
                        "first_name": "John",
                        "last_name": "Smith",
                        "email": "john.smith@example.com",
                        "created_at": "2026-02-27T10:30:00Z"
                    }
                }
            }
        },
        400: {
            "description": "Bad request - Validation error or missing current_password",
            "content": {
                "application/json": {
                    "examples": {
                        "missing_current_password": {
                            "summary": "Missing current password",
                            "value": {"detail": "current_password is required to change password"}
                        },
                        "validation_error": {
                            "summary": "Validation error",
                            "value": {"detail": "Invalid email format"}
                        }
                    }
                }
            }
        },
        401: {
            "description": "Unauthorized - Invalid token or incorrect current password",
            "content": {
                "application/json": {
                    "examples": {
                        "invalid_token": {
                            "summary": "Invalid authentication token",
                            "value": {"detail": "Invalid authentication token"}
                        },
                        "wrong_password": {
                            "summary": "Current password is incorrect",
                            "value": {"detail": "Current password is incorrect"}
                        }
                    }
                }
            }
        },
        404: {
            "description": "Caregiver profile not found",
            "content": {
                "application/json": {
                    "example": {"detail": "Caregiver profile not found"}
                }
            }
        },
        409: {
            "description": "Conflict - Email address already in use",
            "content": {
                "application/json": {
                    "example": {"detail": "Email address already in use"}
                }
            }
        },
        500: {
            "description": "Internal server error",
            "content": {
                "application/json": {
                    "example": {"detail": "Failed to update profile"}
                }
            }
        }
    }
)
async def update_my_profile(
    request: CaregiverUpdate,
    caregiver_id: str = Depends(get_current_caregiver_id),
    caregiver_facade: CaregiverFacade = Depends(get_caregiver_facade)
):
    """Update current caregiver's profile.

    Updates the authenticated caregiver's profile details.
    Only provided fields will be updated (partial updates supported).

    Args:
        request (CaregiverUpdate): Updated profile data (all fields optional)
        caregiver_id (str): ID of authenticated caregiver
        caregiver_facade (CaregiverFacade): Caregiver service facade

    Returns:
        CaregiverResponse: Updated caregiver profile

    Raises:
        HTTPException: If profile not found or validation error occurs
    """
    try:
        # Verify the profile exists
        caregiver = caregiver_facade.get_caregiver(UUID(caregiver_id))

        if not caregiver:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Caregiver profile not found"
            )

        # Build update data from provided fields only
        update_data = {}
        if request.first_name is not None:
            update_data["first_name"] = request.first_name
        if request.last_name is not None:
            update_data["last_name"] = request.last_name
        if request.email is not None:
            update_data["email"] = request.email
        if request.password is not None:
            if not request.current_password:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="current_password is required to change password"
                )
            if not caregiver.verify_password(request.current_password):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Current password is incorrect"
                )
            update_data["password"] = request.password

        # If no fields to update, return current data
        if not update_data:
            return CaregiverResponse(
                id=str(caregiver.id),
                first_name=caregiver.first_name,
                last_name=caregiver.last_name,
                email=caregiver.email,
                created_at=caregiver.created_at
            )

        # Perform update
        updated_caregiver = caregiver_facade.update_caregiver(
            UUID(caregiver_id), update_data)

        return CaregiverResponse(
            id=str(updated_caregiver.id),
            first_name=updated_caregiver.first_name,
            last_name=updated_caregiver.last_name,
            email=updated_caregiver.email,
            created_at=updated_caregiver.created_at
        )

    except HTTPException:
        raise
    except IntegrityError as e:
        # Handle duplicate email constraint violation
        if "ix_caregiver_email" in str(e.orig) or "unique constraint" in str(e.orig).lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email address already in use"
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database constraint violation"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update profile: {str(e)}"
        )


@router.delete(
    "/me",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete caregiver account",
    description="""
    Permanently delete the authenticated caregiver's account.
    
    **⚠️ Warning:** This action is irreversible and will:
    - Delete the caregiver account permanently
    - Remove all associations with user profiles
    - Delete all reminders created by this caregiver
    - Invalidate all JWT tokens
    
    **Authentication required:** Bearer token (caregiver)
    
    **Before deletion, consider:**
    - Backing up important data
    - Transferring user profiles to another caregiver
    - Informing users of the account closure
    
    After successful deletion, the client should:
    - Clear all local storage
    - Remove authentication tokens
    - Redirect to login/welcome screen
    """,
    responses={
        204: {
            "description": "Caregiver account deleted successfully (no content returned)"
        },
        401: {
            "description": "Unauthorized - Invalid or expired token",
            "content": {
                "application/json": {
                    "example": {"detail": "Invalid authentication token"}
                }
            }
        },
        404: {
            "description": "Caregiver profile not found",
            "content": {
                "application/json": {
                    "example": {"detail": "Caregiver profile not found"}
                }
            }
        },
        500: {
            "description": "Internal server error",
            "content": {
                "application/json": {
                    "example": {"detail": "Failed to delete account"}
                }
            }
        }
    }
)
async def delete_my_profile(
    caregiver_id: str = Depends(get_current_caregiver_id),
    caregiver_facade: CaregiverFacade = Depends(get_caregiver_facade)
):
    """Delete current caregiver's account.

    Deletes the authenticated caregiver's account.
    Warning: This action is irreversible.

    Args:
        caregiver_id (str): ID of authenticated caregiver
        caregiver_facade (CaregiverFacade): Caregiver service facade

    Returns:
        None: Returns 204 No Content on success

    Raises:
        HTTPException: If deletion fails
    """
    try:
        # Verify the profile exists
        caregiver = caregiver_facade.get_caregiver(UUID(caregiver_id))

        if not caregiver:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Caregiver profile not found"
            )

        # Delete the caregiver account
        success = caregiver_facade.delete_caregiver(UUID(caregiver_id))

        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete caregiver account"
            )

        return None

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete account: {str(e)}"
        )


# Export for use in other modules
__all__ = ["router"]
