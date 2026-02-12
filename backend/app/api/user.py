"""User/Profile API module.

This module provides endpoints for managing user profiles (elderly persons).
Caregivers can create and manage profiles for the people they care for.
"""

from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List
from app.services.caregiver_facade import CaregiverFacade
from app.schemas.user_schema import UserCreate, UserResponse
from app.services.user_facade import UserFacade
from app.api.authentication import verify_token
from app import get_db

# Router
router = APIRouter(prefix="/api/profiles", tags=["User Profiles"])


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


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_profile(
    request: UserCreate,
    caregiver_id: str = Depends(get_current_caregiver_id),
    user_facade: UserFacade = Depends(get_user_facade),
    caregiver_facade: CaregiverFacade = Depends(get_caregiver_facade)
):
    """Create a new user profile.
    
    Creates a profile for an elderly person and associates it with the authenticated caregiver.
    
    Args:
        request (UserCreate): User profile data
        caregiver_id (str): ID of authenticated caregiver
        user_facade (UserFacade): User service facade
        
    Returns:
        UserResponse: Created user profile
        
    Raises:
        HTTPException: If validation fails or creation error occurs
    """
    try:
        user_data = {
            "first_name": request.first_name,
            "last_name": request.last_name,
            "birthday": request.birthday
        }
        
        user = user_facade.create_user(user_data, UUID(caregiver_id))
        caregiver_facade.add_user_to_caregiver(caregiver_id, user.id)

        return UserResponse(
            id=user.id,
            first_name=user.first_name,
            last_name=user.last_name,
            birthday=user.birthday,
            caregiver_ids=user.caregiver_ids,
            created_at=user.created_at,
            updated_at=user.updated_at
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
            detail=f"Failed to create profile: {str(e)}"
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


# Export for use in other modules
__all__ = ["router"]
