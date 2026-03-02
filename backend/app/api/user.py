"""User/Profile API module.

This module provides endpoints for managing user profiles (elderly persons).
Caregivers can create and manage profiles for the people they care for.
"""

from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List
from datetime import datetime, timezone, timedelta
from app.services.caregiver_facade import CaregiverFacade
from app.schemas.user_schema import UserCreate, UserUpdate, UserResponse, UserWithPairingCodeResponse
from app.schemas.pairing_code_schema import PairingCodeResponse
from app.services.user_facade import UserFacade
from app.api.authentication import verify_token
from app.persistence.pairing_code_repository import PairingCodeRepository
from app.models.pairing_code import PairingCodeModel
from app import get_db
import secrets
import string

# Router
router = APIRouter(prefix="/api/users", tags=["Users"])


def get_user_facade(db: Session = Depends(get_db)) -> UserFacade:
    """Dependency to create UserFacade instance with database session."""
    return UserFacade(db)


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


@router.post(
    "",
    response_model=UserWithPairingCodeResponse,
    summary="Create a new user profile",
    description="""
    Create a new user profile (elderly person) and generate a pairing code.
    
    This endpoint allows caregivers to create profiles for the people they care for.
    Upon creation, a unique 6-digit pairing code is automatically generated, valid
    for 24 hours. This code can be used by the elderly person to pair their device.
    
    **Authentication required:** Bearer token (caregiver)
    
    **Profile includes:**
    - First name and last name
    - Birthday
    - Associated caregiver IDs
    
    **Pairing code:**
    - 6-digit numeric code
    - Valid for 24 hours
    - Unique per user
    """,
    responses={
        200: {
            "description": "User profile created successfully with pairing code",
            "content": {
                "application/json": {
                    "example": {
                        "user": {
                            "id": "123e4567-e89b-12d3-a456-426614174000",
                            "first_name": "Marie",
                            "last_name": "Dupont",
                            "birthday": "1950-05-15",
                            "caregiver_ids": ["987e6543-e89b-12d3-a456-426614174000"],
                            "created_at": "2026-02-27T10:30:00Z",
                            "updated_at": "2026-02-27T10:30:00Z"
                        },
                        "pairing_code": {
                            "code": "123456",
                            "expires_at": "2026-02-28T10:30:00Z"
                        }
                    }
                }
            }
        },
        400: {
            "description": "Bad request - Validation error",
            "content": {
                "application/json": {
                    "example": {"detail": "Invalid birthday format"}
                }
            }
        },
        401: {
            "description": "Unauthorized - Invalid or expired token",
            "content": {
                "application/json": {
                    "example": {"detail": "Invalid authentication token"}
                }
            }
        },
        500: {
            "description": "Internal server error",
            "content": {
                "application/json": {
                    "example": {"detail": "Failed to create profile"}
                }
            }
        }
    }
)
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
        def generate_pairing_code() -> str:
            """Generate a 6-digit numeric pairing code."""
            return ''.join(secrets.choice(string.digits) for _ in range(6))

        pairing_repo = PairingCodeRepository(db)
        code = generate_pairing_code()
        
        # Ensure uniqueness
        while pairing_repo.find_by_code(code):
            code = generate_pairing_code()

        # Create pairing code
        pairing_code = PairingCodeModel()
        pairing_code.code = code
        pairing_code.user_id = user.id
        pairing_code.caregiver_id = UUID(caregiver_id)
        pairing_code.expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)

        pairing_repo.add(pairing_code)

        # Build response
        user_response = UserResponse(
            id=user.id,
            first_name=user.first_name,
            last_name=user.last_name,
            birthday=user.birthday,
            caregiver_ids=user.caregiver_ids,
            created_at=user.created_at,
            updated_at=user.updated_at
        )

        pairing_response = PairingCodeResponse(
            code=pairing_code.code,
            expires_at=pairing_code.expires_at
        )

        return UserWithPairingCodeResponse(
            user=user_response,
            pairing_code=pairing_response
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


@router.get(
    "",
    response_model=List[UserResponse],
    summary="List all user profiles",
    description="""
    Retrieve all user profiles associated with the authenticated caregiver.
    
    Returns a list of all elderly persons (users) that the caregiver is
    responsible for. Each profile includes complete user information.
    
    **Authentication required:** Bearer token (caregiver)
    
    **Use cases:**
    - Display list of users in the app
    - Select a user for viewing details
    - Overview of all managed profiles
    """,
    responses={
        200: {
            "description": "List of user profiles retrieved successfully",
            "content": {
                "application/json": {
                    "example": [
                        {
                            "id": "123e4567-e89b-12d3-a456-426614174000",
                            "first_name": "Marie",
                            "last_name": "Dupont",
                            "birthday": "1950-05-15",
                            "caregiver_ids": ["987e6543-e89b-12d3-a456-426614174000"],
                            "created_at": "2026-02-27T10:30:00Z",
                            "updated_at": "2026-02-27T10:30:00Z"
                        }
                    ]
                }
            }
        },
        401: {
            "description": "Unauthorized - Invalid or expired token",
            "content": {
                "application/json": {
                    "example": {"detail": "Invalid authentication token"}
                }
            }
        },
        500: {
            "description": "Internal server error",
            "content": {
                "application/json": {
                    "example": {"detail": "Failed to retrieve profiles"}
                }
            }
        }
    }
)
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


@router.get(
    "/{profile_id}",
    response_model=UserResponse,
    summary="Get user profile details",
    description="""
    Retrieve detailed information for a specific user profile by ID.
    
    Returns complete profile details if the caregiver has access to this user.
    Access is verified by checking if the caregiver ID is in the user's
    caregiver_ids list.
    
    **Authentication required:** Bearer token (caregiver)
    
    **Access control:**
    - Only caregivers associated with this user can access the profile
    - Returns 403 Forbidden if access is denied
    """,
    responses={
        200: {
            "description": "User profile retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "id": "123e4567-e89b-12d3-a456-426614174000",
                        "first_name": "Marie",
                        "last_name": "Dupont",
                        "birthday": "1950-05-15",
                        "caregiver_ids": ["987e6543-e89b-12d3-a456-426614174000"],
                        "created_at": "2026-02-27T10:30:00Z",
                        "updated_at": "2026-02-27T10:30:00Z"
                    }
                }
            }
        },
        401: {
            "description": "Unauthorized - Invalid or expired token",
            "content": {
                "application/json": {
                    "example": {"detail": "Invalid authentication token"}
                }
            }
        },
        403: {
            "description": "Forbidden - No access to this profile",
            "content": {
                "application/json": {
                    "example": {"detail": "You don't have access to this profile"}
                }
            }
        },
        404: {
            "description": "Profile not found",
            "content": {
                "application/json": {
                    "example": {"detail": "Profile not found"}
                }
            }
        },
        500: {
            "description": "Internal server error",
            "content": {
                "application/json": {
                    "example": {"detail": "Failed to retrieve profile"}
                }
            }
        }
    }
)
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


@router.put(
    "/{profile_id}",
    response_model=UserResponse,
    summary="Update user profile",
    description="""
    Update an existing user profile with new information.
    
    Supports partial updates - only provided fields will be updated.
    The caregiver must have access to this profile to update it.
    
    **Authentication required:** Bearer token (caregiver)
    
    **Updatable fields:**
    - First name
    - Last name
    - Birthday
    
    **Access control:**
    - Only caregivers associated with this user can update the profile
    - Returns 403 Forbidden if access is denied
    """,
    responses={
        200: {
            "description": "User profile updated successfully",
            "content": {
                "application/json": {
                    "example": {
                        "id": "123e4567-e89b-12d3-a456-426614174000",
                        "first_name": "Marie",
                        "last_name": "Dupont",
                        "birthday": "1950-05-15",
                        "caregiver_ids": ["987e6543-e89b-12d3-a456-426614174000"],
                        "created_at": "2026-02-27T10:30:00Z",
                        "updated_at": "2026-02-27T11:00:00Z"
                    }
                }
            }
        },
        400: {
            "description": "Bad request - Validation error",
            "content": {
                "application/json": {
                    "example": {"detail": "Invalid birthday format"}
                }
            }
        },
        401: {
            "description": "Unauthorized - Invalid or expired token",
            "content": {
                "application/json": {
                    "example": {"detail": "Invalid authentication token"}
                }
            }
        },
        403: {
            "description": "Forbidden - No access to this profile",
            "content": {
                "application/json": {
                    "example": {"detail": "You don't have access to this profile"}
                }
            }
        },
        404: {
            "description": "Profile not found",
            "content": {
                "application/json": {
                    "example": {"detail": "Profile not found"}
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


@router.delete(
    "/{profile_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete user profile",
    description="""
    Permanently delete a user profile from the system.
    
    This action will:
    - Remove the user profile completely
    - Remove the user ID from all associated caregivers
    - Delete all associated reminders and pairing codes
    
    **Authentication required:** Bearer token (caregiver)
    
    **Access control:**
    - Only caregivers associated with this user can delete the profile
    - Returns 403 Forbidden if access is denied
    
    **Warning:** This action cannot be undone!
    """,
    responses={
        204: {
            "description": "User profile deleted successfully (no content returned)"
        },
        401: {
            "description": "Unauthorized - Invalid or expired token",
            "content": {
                "application/json": {
                    "example": {"detail": "Invalid authentication token"}
                }
            }
        },
        403: {
            "description": "Forbidden - No access to this profile",
            "content": {
                "application/json": {
                    "example": {"detail": "You don't have access to this profile"}
                }
            }
        },
        404: {
            "description": "Profile not found",
            "content": {
                "application/json": {
                    "example": {"detail": "Profile not found"}
                }
            }
        },
        500: {
            "description": "Internal server error",
            "content": {
                "application/json": {
                    "example": {"detail": "Failed to delete profile"}
                }
            }
        }
    }
)
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
                caregiver_facade.remove_user_from_caregiver(
                    str(cg_id), profile_id)
            except Exception as e:
                # Log error but continue with deletion
                import traceback
                traceback.print_exc()
                print(
                    f"Warning: Could not remove user from caregiver {cg_id}: {e}")

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
