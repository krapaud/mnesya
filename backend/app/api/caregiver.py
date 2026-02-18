"""Caregiver Profile API module.

This module provides endpoints for managing caregiver profiles.
Caregivers can view and update their own profile information.
"""

from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List
from app.services.caregiver_facade import CaregiverFacade
from app.schemas.caregiver_schema import CaregiverUpdate, CaregiverResponse
from app.api.authentication import verify_token
from app import get_db

# Router
router = APIRouter(prefix="/api/caregivers", tags=["Caregivers"])


def get_caregiver_facade(db: Session = Depends(get_db)) -> CaregiverFacade:
    """Dependency to create CaregiverFacade instance with database session."""
    return CaregiverFacade(db)

def get_current_caregiver_id(token_payload: dict = Depends(verify_token)) -> str:
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

@router.put("/me", response_model=CaregiverResponse)
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
        updated_caregiver = caregiver_facade.update_caregiver(UUID(caregiver_id), update_data)
        
        return CaregiverResponse(
            id=str(updated_caregiver.id),
            first_name=updated_caregiver.first_name,
            last_name=updated_caregiver.last_name,
            email=updated_caregiver.email,
            created_at=updated_caregiver.created_at
        )
        
    except HTTPException:
        raise
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


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
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
