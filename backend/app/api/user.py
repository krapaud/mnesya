"""User/Profile API module.

This module provides endpoints for managing user profiles (elderly persons).
Caregivers can create and manage profiles for the people they care for.
"""

from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List
from app.services.caregiver_facade import CaregiverFacade
from app.schemas.user_schema import UserCreate, UserUpdate, UserResponse
from app.services.user_facade import UserFacade
from app.api.authentication import verify_token
from app import get_db
import string
import random

# Router
router = APIRouter(prefix="/api/users", tags=["Users"])

def id_generator(size=6, chars=string.ascii_uppercase + string.digits):
    return ''.join(random.choice(chars) for _ in range(size))

def get_user_facade(db: Session = Depends(get_db)) -> UserFacade:
    """Dependency to create UserFacade instance with database session."""
    return UserFacade(db)

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


@router.post("", response_model=dict)  # Change response model
async def create_profile(
    request: UserCreate,
    caregiver_id: str = Depends(get_current_caregiver_id),
    user_facade: UserFacade = Depends(get_user_facade),
    caregiver_facade: CaregiverFacade = Depends(get_caregiver_facade),
    db: Session = Depends(get_db)
):
    """Create a new user profile and generate pairing code."""
    try:
        # Create user
        user_data = {
            "first_name": request.first_name,
            "last_name": request.last_name,
            "birthday": request.birthday
        }
        
        user = user_facade.create_user(user_data, UUID(caregiver_id))
        caregiver_facade.add_user_to_caregiver(caregiver_id, user.id)
        
        # Generate pairing code
        from app.persistence.pairing_code_repository import PairingCodeRepository
        from app.models.pairing_code import PairingCodeModel
        from datetime import datetime, timezone, timedelta
        import string
        import random
        
        def generate_code():
            return ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(6))
        
        pairing_repo = PairingCodeRepository(db)
        
        code = generate_code()
        while pairing_repo.find_by_code(code):
            code = generate_code()
        
        pairing_code = PairingCodeModel()
        pairing_code.code = code
        pairing_code.user_id = user.id
        pairing_code.caregiver_id = UUID(caregiver_id)
        pairing_code.expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
        
        pairing_repo.add(pairing_code)
        
        return {
            "user": {
                "id": str(user.id),
                "first_name": user.first_name,
                "last_name": user.last_name,
                "birthday": user.birthday.isoformat(),
                "caregiver_ids": [str(cid) for cid in user.caregiver_ids],
                "created_at": user.created_at.isoformat(),
                "updated_at": user.updated_at.isoformat()
            },
            "pairing_code": {
                "code": code,
                "expires_at": pairing_code.expires_at.isoformat()
            }
        }

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
            detail=f"Failed to create profile: {str(e)}"
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    token_payload: dict = Depends(verify_token),
    user_facade: UserFacade = Depends(get_user_facade)
):
    """Get current authenticated user profile.
    
    Args:
        token_payload (dict): Decoded JWT token
        user_facade (UserFacade): User service facade
        
    Returns:
        UserResponse: Current user profile
        
    Raises:
        HTTPException: If user not found
    """
    try:
        user_id = token_payload.get("sub")
        user = user_facade.get_user(UUID(user_id))
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return UserResponse(
            id=user.id,
            first_name=user.first_name,
            last_name=user.last_name,
            birthday=user.birthday,
            caregiver_ids=user.caregiver_ids,
            created_at=user.created_at,
            updated_at=user.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get profile: {str(e)}"
        )

@router.get("", response_model=List[UserResponse])
async def list_profiles(
    caregiver_id: str = Depends(get_current_caregiver_id),
    user_facade: UserFacade = Depends(get_user_facade)
):
    """List all profiles for the authenticated caregiver.

    Returns all user profiles associated with the current caregiver.

    Args:
        caregiver_id (str): ID of authenticated caregiver
        user_facade (UserFacade): User service facade

    Returns:
        List[UserResponse]: List of user profiles

    Raises:
        HTTPException: If retrieval error occurs
    """
    try:
        users = user_facade.get_users_by_caregiver(UUID(caregiver_id))

        return [
            UserResponse(
                id=user.id,
                first_name=user.first_name,
                last_name=user.last_name,
                birthday=user.birthday,
                caregiver_ids=user.caregiver_ids,
                created_at=user.created_at,
                updated_at=user.updated_at
            )
            for user in users
        ]

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve profiles: {str(e)}"
        )


@router.get("/{profile_id}", response_model=UserResponse)
async def get_profile(
    profile_id: UUID,
    caregiver_id: str = Depends(get_current_caregiver_id),
    user_facade: UserFacade = Depends(get_user_facade)
):
    """Get details of a specific user profile.

    Returns profile details if the profile belongs to the authenticated caregiver.

    Args:
        profile_id (UUID): ID of the profile to retrieve
        caregiver_id (str): ID of authenticated caregiver
        user_facade (UserFacade): User service facade

    Returns:
        UserResponse: User profile details

    Raises:
        HTTPException: If profile not found or access denied
    """
    try:
        user = user_facade.get_user(profile_id)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )

        # Verify that this caregiver has access to this profile
        if UUID(caregiver_id) not in user.caregiver_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this profile"
            )

        return UserResponse(
            id=user.id,
            first_name=user.first_name,
            last_name=user.last_name,
            birthday=user.birthday,
            caregiver_ids=user.caregiver_ids,
            created_at=user.created_at,
            updated_at=user.updated_at
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


@router.put("/{profile_id}", response_model=UserResponse)
async def update_profile(
    profile_id: UUID,
    request: UserUpdate,
    caregiver_id: str = Depends(get_current_caregiver_id),
    user_facade: UserFacade = Depends(get_user_facade)
):
    """Update an existing user profile.
    
    Updates profile details if the profile belongs to the authenticated caregiver.
    Only provided fields will be updated (partial updates supported).
    
    Args:
        profile_id (UUID): ID of the profile to update
        request (UserUpdate): Updated profile data (all fields optional)
        caregiver_id (str): ID of authenticated caregiver
        user_facade (UserFacade): User service facade
        
    Returns:
        UserResponse: Updated user profile
        
    Raises:
        HTTPException: If profile not found, access denied, or validation error occurs
    """
    try:
        # First verify the profile exists and caregiver has access
        user = user_facade.get_user(profile_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )
        
        # Verify that this caregiver has access to this profile
        if UUID(caregiver_id) not in user.caregiver_ids:
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
            return UserResponse(
                id=user.id,
                first_name=user.first_name,
                last_name=user.last_name,
                birthday=user.birthday,
                caregiver_ids=user.caregiver_ids,
                created_at=user.created_at,
                updated_at=user.updated_at
            )
        
        # Perform update
        updated_user = user_facade.update_user(profile_id, update_data)
        
        return UserResponse(
            id=updated_user.id,
            first_name=updated_user.first_name,
            last_name=updated_user.last_name,
            birthday=updated_user.birthday,
            caregiver_ids=updated_user.caregiver_ids,
            created_at=updated_user.created_at,
            updated_at=updated_user.updated_at
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
    user_facade: UserFacade = Depends(get_user_facade),
    caregiver_facade: CaregiverFacade = Depends(get_caregiver_facade)
):
    """Delete a user profile.
    
    Deletes a profile if it belongs to the authenticated caregiver.
    Also removes the user ID from all associated caregivers' user_ids lists.
    
    Args:
        profile_id (UUID): ID of the profile to delete
        caregiver_id (str): ID of authenticated caregiver
        user_facade (UserFacade): User service facade
        caregiver_facade (CaregiverFacade): Caregiver service facade
        
    Returns:
        None: Returns 204 No Content on success
        
    Raises:
        HTTPException: If profile not found or access denied
    """
    try:
        # First verify the profile exists and caregiver has access
        user = user_facade.get_user(profile_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )
        
        # Verify that this caregiver has access to this profile
        if UUID(caregiver_id) not in user.caregiver_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this profile"
            )
        
        # Remove user from all associated caregivers
        for cg_id in user.caregiver_ids:
            try:
                caregiver_facade.remove_user_from_caregiver(str(cg_id), profile_id)
            except Exception as e:
                # Log error but continue with deletion
                import traceback
                traceback.print_exc()
                print(f"Warning: Could not remove user from caregiver {cg_id}: {e}")
        
        # Delete the profile
        success = user_facade.delete_user(profile_id)
        
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
