"""caregiver/Profile API module.

This module provides endpoints for managing caregiver profiles (elderly persons).
Caregivers can create and manage profiles for the people they care for.
"""

from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List
from app.services.caregiver_facade import CaregiverFacade
from app.schemas.caregiver_schema import CaregiverCreate, CaregiverUpdate, CaregiverResponse
from app.api.authentication import verify_token
from app import get_db

# Router
router = APIRouter(prefix="/api/profiles", tags=["caregiver Profiles"])


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



@router.get("/{caregiver_id}", response_model=CaregiverResponse)
async def get_caregiver(
    caregiver_id: UUID,
    caregiver_facade: CaregiverFacade = Depends(get_caregiver_facade)
):
    """Get details of a specific caregiver caregiver.
    
    Returns caregiver details if the caregiver belongs to the authenticated caregiver.
    
    Args:
        caregiver_id (UUID): ID of the caregiver to retrieve
        caregiver_id (str): ID of authenticated caregiver
        caregiver_facade (caregiverFacade): caregiver service facade
        
    Returns:
        caregiverResponse: caregiver caregiver details
        
    Raises:
        HTTPException: If caregiver not found or access denied
    """
    try:
        caregiver = caregiver_facade.get_caregiver(caregiver_id)
        
        if not caregiver:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="caregiver not found"
            )
        
        # Verify that this caregiver has access to this caregiver
        if UUID(caregiver_id) not in caregiver.caregiver_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this caregiver"
            )
        
        return CaregiverResponse(
            id=str(caregiver.id),
            first_name=caregiver.first_name,
            last_name=caregiver.last_name,
            email=caregiver.email,
            created_at=caregiver.created_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve profile: {str(e)}"
        )


@router.put("/{profile_id}", response_model=CaregiverResponse)
async def update_profile(
    profile_id: UUID,
    request: CaregiverUpdate,
    caregiver_id: str = Depends(get_current_caregiver_id),
    caregiver_facade: CaregiverFacade = Depends(get_caregiver_facade)
):
    """Update an existing caregiver profile.
    
    Updates profile details if the profile belongs to the authenticated caregiver.
    Only provided fields will be updated (partial updates supported).
    
    Args:
        profile_id (UUID): ID of the profile to update
        request (caregiverUpdate): Updated profile data (all fields optional)
        caregiver_id (str): ID of authenticated caregiver
        caregiver_facade (caregiverFacade): caregiver service facade
        
    Returns:
        caregiverResponse: Updated caregiver profile
        
    Raises:
        HTTPException: If profile not found, access denied, or validation error occurs
    """
    try:
        # First verify the profile exists and caregiver has access
        caregiver = caregiver_facade.get_caregiver(profile_id)
        
        if not caregiver:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )
        
        # Verify that this caregiver has access to this profile
        if UUID(caregiver_id) not in caregiver.caregiver_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this profile"
            )
        
        # Build update data from provided fields only
        update_data = {}
        if request.first_name is not None:
            update_data["first_name"] = request.first_name
        if request.last_name is not None:
            update_data["last_name"] = request.last_name
        if request.birthday is not None:
            update_data["birthday"] = request.birthday
        
        # If no fields to update, return current data
        if not update_data:
            return CaregiverResponse(
                id=caregiver.id,
                first_name=caregiver.first_name,
                last_name=caregiver.last_name,
                birthday=caregiver.birthday,
                caregiver_ids=caregiver.caregiver_ids,
                created_at=caregiver.created_at,
                updated_at=caregiver.updated_at
            )
        
        # Perform update
        updated_caregiver = caregiver_facade.update_caregiver(profile_id, update_data)
        
        return CaregiverResponse(
            id=updated_caregiver.id,
            first_name=updated_caregiver.first_name,
            last_name=updated_caregiver.last_name,
            birthday=updated_caregiver.birthday,
            caregiver_ids=updated_caregiver.caregiver_ids,
            created_at=updated_caregiver.created_at,
            updated_at=updated_caregiver.updated_at
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


@router.delete("/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_profile(
    profile_id: UUID,
    caregiver_id: str = Depends(get_current_caregiver_id),
    caregiver_facade: CaregiverFacade = Depends(get_caregiver_facade)
):
    """Delete a caregiver profile.
    
    Deletes a profile if it belongs to the authenticated caregiver.
    Also removes the caregiver ID from all associated caregivers' caregiver_ids lists.
    
    Args:
        profile_id (UUID): ID of the profile to delete
        caregiver_id (str): ID of authenticated caregiver
        caregiver_facade (caregiverFacade): caregiver service facade
        caregiver_facade (CaregiverFacade): Caregiver service facade
        
    Returns:
        None: Returns 204 No Content on success
        
    Raises:
        HTTPException: If profile not found or access denied
    """
    try:
        # First verify the profile exists and caregiver has access
        caregiver = caregiver_facade.get_caregiver(profile_id)
        
        if not caregiver:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )
        
        # Verify that this caregiver has access to this profile
        if UUID(caregiver_id) not in caregiver.caregiver_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this profile"
            )
        
        # Remove caregiver from all associated caregivers
        for cg_id in caregiver.caregiver_ids:
            try:
                caregiver_facade.remove_caregiver_from_caregiver(str(cg_id), profile_id)
            except Exception as e:
                # Log error but continue with deletion
                import traceback
                traceback.print_exc()
                print(f"Warning: Could not remove caregiver from caregiver {cg_id}: {e}")
        
        # Delete the profile
        success = caregiver_facade.delete_caregiver(profile_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete profile"
            )
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete profile: {str(e)}"
        )


# Export for use in other modules
__all__ = ["router"]
