"""Reminder API module.

This module provides endpoints for managing reminders associated with users.
Caregivers can create, read, update, and delete reminders for their users.
"""

import traceback
from uuid import UUID
from typing import List

from fastapi import APIRouter, HTTPException, Depends, status, Body
from sqlalchemy.orm import Session

from app.services.reminder_facade import ReminderFacade
from app.schemas.reminder_schema import (
    ReminderResponse,
    ReminderCreate,
    ReminderUpdate,
)
from app.services.user_facade import UserFacade
from app.api.authentication import verify_token
from app import get_db

router = APIRouter(prefix="/api/reminder", tags=["Reminder"])


def get_reminder_facade(
    db: Session = Depends(get_db),
) -> ReminderFacade:
    """Dependency to create ReminderFacade instance with database session."""
    return ReminderFacade(db)


def get_user_facade(db: Session = Depends(get_db)) -> UserFacade:
    """Dependency to create UserFacade instance with database session."""
    return UserFacade(db)


def get_caregiver_id(
    token: dict = Depends(verify_token),
) -> str:
    """Extract caregiver ID from JWT token."""
    return token.get("sub")


def build_reminder_response(reminder) -> ReminderResponse:
    """Build a ReminderResponse from a reminder object."""
    return ReminderResponse(
        id=reminder.id,
        title=reminder.title,
        description=reminder.description,
        scheduled_at=reminder.scheduled_at,
        caregiver_id=reminder.caregiver_id,
        user_id=reminder.user_id,
        user_first_name=getattr(reminder, "user_first_name", None),
        user_last_name=getattr(reminder, "user_last_name", None),
        created_at=reminder.created_at,
        updated_at=reminder.updated_at,
    )


@router.get(
    "/caregiver",
    response_model=List[ReminderResponse],
    summary="Get all reminders by caregiver",
    description="""
    Retrieve all reminders created by the authenticated caregiver.
    
    Returns a list of all reminders that the caregiver has created for their
    users. This includes reminders for all users associated with the caregiver.
    
    **Authentication required:** Bearer token (caregiver)
    
    **Response includes:**
    - Reminder details (title, description, scheduled time)
    - Associated user information (first name, last name)
    - Creation and update timestamps
    
    **Use cases:**
    - Display all reminders in the caregiver's dashboard
    - Filter and search across all managed reminders
    - Overview of upcoming reminders for all users
    """,
    responses={
        200: {
            "description": "List of reminders retrieved successfully",
            "content": {
                "application/json": {
                    "example": [
                        {
                            "id": "123e4567-e89b-12d3-a456-426614174000",
                            "title": "Take medication",
                            "description": "Take blood pressure medication with water",
                            "scheduled_at": "2026-02-27T14:00:00Z",
                            "caregiver_id": "987e6543-e89b-12d3-a456-426614174000",
                            "user_id": "456e7890-e89b-12d3-a456-426614174000",
                            "user_first_name": "Marie",
                            "user_last_name": "Dupont",
                            "created_at": "2026-02-27T10:30:00Z",
                            "updated_at": "2026-02-27T10:30:00Z",
                        }
                    ]
                }
            },
        },
        401: {
            "description": "Unauthorized - Invalid or expired token",
            "content": {
                "application/json": {
                    "example": {"detail": "Could not validate credentials"}
                }
            },
        },
        500: {
            "description": "Internal server error",
            "content": {
                "application/json": {
                    "example": {"detail": "Failed to retrieve reminders"}
                }
            },
        },
    },
)
async def get_all_reminder_by_caregiver(
    caregiver_id: str = Depends(get_caregiver_id),
    reminder_facade: ReminderFacade = Depends(get_reminder_facade),
):
    """Get all reminders created by the authenticated caregiver.

    Retrieves all reminders that were created by the currently
    authenticated caregiver.

    Args:
        caregiver_id (str): ID of the authenticated caregiver
            (extracted from JWT token)
        reminder_facade (ReminderFacade): Reminder service facade

    Returns:
        List[ReminderResponse]: List of reminders created by the caregiver

    Raises:
        HTTPException: If retrieval fails with 500 status code
    """
    try:
        reminders = reminder_facade.get_reminder_by_caregiver(UUID(caregiver_id))
        return [build_reminder_response(r) for r in reminders]

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve reminders: {str(e)}",
        )


@router.get(
    "/user",
    response_model=List[ReminderResponse],
    summary="Get all reminders for user",
    description="""
    Retrieve all reminders assigned to the authenticated user.
    
    Returns a list of all reminders that have been created for the currently
    authenticated user (elderly person). This endpoint is typically used by
    the user's mobile app to display their personal reminders.
    
    **Authentication required:** Bearer token (user)
    
    **Note:** The user_id is extracted from the JWT token, so users can only
    see their own reminders.
    
    **Response includes:**
    - Reminder details (title, description, scheduled time)
    - Caregiver information
    - Creation and update timestamps
    
    **Use cases:**
    - Display reminders in the user's app
    - Show upcoming reminders on the home screen
    - List of all assigned tasks/reminders
    """,
    responses={
        200: {
            "description": "List of user reminders retrieved successfully",
            "content": {
                "application/json": {
                    "example": [
                        {
                            "id": "123e4567-e89b-12d3-a456-426614174000",
                            "title": "Take medication",
                            "description": "Take blood pressure medication with water",
                            "scheduled_at": "2026-02-27T14:00:00Z",
                            "caregiver_id": "987e6543-e89b-12d3-a456-426614174000",
                            "user_id": "456e7890-e89b-12d3-a456-426614174000",
                            "user_first_name": "Marie",
                            "user_last_name": "Dupont",
                            "created_at": "2026-02-27T10:30:00Z",
                            "updated_at": "2026-02-27T10:30:00Z",
                        }
                    ]
                }
            },
        },
        401: {
            "description": "Unauthorized - Invalid or expired token",
            "content": {
                "application/json": {
                    "example": {"detail": "Could not validate credentials"}
                }
            },
        },
        500: {
            "description": "Internal server error",
            "content": {
                "application/json": {
                    "example": {"detail": "Failed to retrieve reminders"}
                }
            },
        },
    },
)
async def get_all_reminder_by_user(
    user_id: str = Depends(get_caregiver_id),
    reminder_facade: ReminderFacade = Depends(get_reminder_facade),
    user_facade: UserFacade = Depends(get_user_facade),
):
    """Get all reminders for the authenticated user.

    Retrieves all reminders that are assigned to the currently
    authenticated user.

    Args:
        user_id (str): ID of the authenticated user
            (extracted from JWT token)
        reminder_facade (ReminderFacade): Reminder service facade
        user_facade (UserFacade): User service facade

    Returns:
        List[ReminderResponse]: List of reminders assigned to the user

    Raises:
        HTTPException: 401 if the user no longer exists, 500 if retrieval fails
    """
    try:
        user = user_facade.get_user(UUID(user_id))
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )
        reminders = reminder_facade.get_reminder_by_user(UUID(user_id))
        return [build_reminder_response(r) for r in reminders]

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve reminders: {str(e)}",
        )


@router.get(
    "/{reminder_id}",
    response_model=ReminderResponse,
    summary="Get reminder details",
    description="""
    Retrieve detailed information for a specific reminder by ID.
    
    Returns complete details for a single reminder including title, description,
    scheduled time, and associated user information.
    
    **Authentication required:** Bearer token (caregiver or user)
    
    **Use cases:**
    - View detailed reminder information
    - Edit reminder (get current values)
    - Display reminder details in a modal/drawer
    """,
    responses={
        200: {
            "description": "Reminder details retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "id": "123e4567-e89b-12d3-a456-426614174000",
                        "title": "Take medication",
                        "description": "Take blood pressure medication with water",
                        "scheduled_at": "2026-02-27T14:00:00Z",
                        "caregiver_id": "987e6543-e89b-12d3-a456-426614174000",
                        "user_id": "456e7890-e89b-12d3-a456-426614174000",
                        "user_first_name": "Marie",
                        "user_last_name": "Dupont",
                        "created_at": "2026-02-27T10:30:00Z",
                        "updated_at": "2026-02-27T10:30:00Z",
                    }
                }
            },
        },
        401: {
            "description": "Unauthorized - Invalid or expired token",
            "content": {
                "application/json": {
                    "example": {"detail": "Could not validate credentials"}
                }
            },
        },
        404: {
            "description": "Reminder not found",
            "content": {
                "application/json": {"example": {"detail": "reminder not found"}}
            },
        },
        500: {
            "description": "Internal server error",
            "content": {
                "application/json": {
                    "example": {"detail": "Failed to retrieve reminder"}
                }
            },
        },
    },
)
async def get_reminder(
    reminder_id: UUID,
    reminder_facade: ReminderFacade = Depends(get_reminder_facade),
):
    """Get a specific reminder by ID.

    Retrieves detailed information about a single reminder.

    Args:
        reminder_id (UUID): Unique identifier of the reminder
        reminder_facade (ReminderFacade): Reminder service facade

    Returns:
        ReminderResponse: The requested reminder details

    Raises:
        HTTPException: 404 if reminder not found, 500 if retrieval fails
    """
    try:
        reminder = reminder_facade.get_reminder(str(reminder_id))

        if not reminder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="reminder not found",
            )

        return build_reminder_response(reminder)

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve reminder: {str(e)}",
        )


@router.post(
    "",
    response_model=ReminderResponse,
    summary="Create a new reminder",
    description="""
    Create a new reminder for a user.
    
    Creates a reminder that will be assigned to a specific user. The authenticated
    caregiver must have access to the user to create reminders for them.
    
    **Authentication required:** Bearer token (caregiver)
    
    **Required fields:**
    - title: Short descriptive title
    - description: Detailed description of the reminder
    - scheduled_at: When the reminder should trigger (ISO 8601 datetime)
    - user_id: UUID of the user to assign the reminder to
    
    **Access control:**
    - Caregiver must be associated with the user
    - Returns 403 Forbidden if access is denied
    
    **Use cases:**
    - Create medication reminders
    - Schedule appointments
    - Set up daily task reminders
    """,
    responses={
        200: {
            "description": "Reminder created successfully",
            "content": {
                "application/json": {
                    "example": {
                        "id": "123e4567-e89b-12d3-a456-426614174000",
                        "title": "Take medication",
                        "description": "Take blood pressure medication with water",
                        "scheduled_at": "2026-02-27T14:00:00Z",
                        "caregiver_id": "987e6543-e89b-12d3-a456-426614174000",
                        "user_id": "456e7890-e89b-12d3-a456-426614174000",
                        "user_first_name": "Marie",
                        "user_last_name": "Dupont",
                        "created_at": "2026-02-27T10:30:00Z",
                        "updated_at": "2026-02-27T10:30:00Z",
                    }
                }
            },
        },
        400: {
            "description": "Bad request - Validation error",
            "content": {
                "application/json": {
                    "example": {"detail": "Invalid scheduled_at format"}
                }
            },
        },
        401: {
            "description": "Unauthorized - Invalid or expired token",
            "content": {
                "application/json": {
                    "example": {"detail": "Could not validate credentials"}
                }
            },
        },
        403: {
            "description": "Forbidden - No access to this user",
            "content": {
                "application/json": {
                    "example": {"detail": "You don't have access to this user"}
                }
            },
        },
        500: {
            "description": "Internal server error",
            "content": {
                "application/json": {"example": {"detail": "Failed to create reminder"}}
            },
        },
    },
)
async def create_reminder(
    request: ReminderCreate,
    caregiver_id: str = Depends(get_caregiver_id),
    reminder_facade: ReminderFacade = Depends(get_reminder_facade),
    user_facade: UserFacade = Depends(get_user_facade),
):
    """Create a new reminder for a user.

    Creates a new reminder for a user that the authenticated caregiver
    has access to. The caregiver must be associated with the user to
    create reminders for them.

    Args:
        request (ReminderCreate): Reminder data
            (title, description, scheduled_at, user_id)
        caregiver_id (str): ID of the authenticated caregiver
            (extracted from JWT token)
        reminder_facade (ReminderFacade): Reminder service facade
        user_facade (UserFacade): User service facade

    Returns:
        ReminderResponse: The newly created reminder

    Raises:
        HTTPException: 403 if caregiver doesn't have access to user,
                      400 for validation errors,
                      500 if creation fails
    """
    try:
        user = user_facade.get_user(request.user_id)
        if not user or UUID(caregiver_id) not in user.caregiver_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this user",
            )

        reminder_data = {
            "title": request.title,
            "description": request.description,
            "scheduled_at": request.scheduled_at,
            "user_id": request.user_id,
            "caregiver_id": UUID(caregiver_id),
        }

        reminder = reminder_facade.create_reminder(reminder_data)
        return build_reminder_response(reminder)

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create reminder: {str(e)}",
        )


@router.put(
    "/{reminder_id}",
    response_model=ReminderResponse,
    summary="Update reminder",
    description="""
    Update an existing reminder's details.
    
    Allows the caregiver who created the reminder to update its details.
    Supports partial updates - only the fields you provide will be updated.
    
    **Authentication required:** Bearer token (caregiver)
    
    **Updatable fields:**
    - title: Reminder title
    - description: Detailed description
    - scheduled_at: Scheduled time
    
    **Access control:**
    - Only the caregiver who created the reminder can update it
    - Returns 403 Forbidden if access is denied
    
    **Use cases:**
    - Reschedule a reminder
    - Update reminder description
    - Modify reminder title
    """,
    responses={
        200: {
            "description": "Reminder updated successfully",
            "content": {
                "application/json": {
                    "example": {
                        "id": "123e4567-e89b-12d3-a456-426614174000",
                        "title": "Take medication",
                        "description": "Take blood pressure medication with food",
                        "scheduled_at": "2026-02-27T15:00:00Z",
                        "caregiver_id": "987e6543-e89b-12d3-a456-426614174000",
                        "user_id": "456e7890-e89b-12d3-a456-426614174000",
                        "user_first_name": "Marie",
                        "user_last_name": "Dupont",
                        "created_at": "2026-02-27T10:30:00Z",
                        "updated_at": "2026-02-27T11:00:00Z",
                    }
                }
            },
        },
        400: {
            "description": "Bad request - Validation error",
            "content": {
                "application/json": {
                    "example": {"detail": "Invalid scheduled_at format"}
                }
            },
        },
        401: {
            "description": "Unauthorized - Invalid or expired token",
            "content": {
                "application/json": {
                    "example": {"detail": "Could not validate credentials"}
                }
            },
        },
        403: {
            "description": "Forbidden - No access to this reminder",
            "content": {
                "application/json": {
                    "example": {"detail": "You don't have access to this reminder"}
                }
            },
        },
        404: {
            "description": "Reminder not found",
            "content": {
                "application/json": {"example": {"detail": "Reminder not found"}}
            },
        },
        500: {
            "description": "Internal server error",
            "content": {
                "application/json": {"example": {"detail": "Failed to update reminder"}}
            },
        },
    },
)
async def update_reminder(
    reminder_id: UUID,
    request: ReminderUpdate,
    caregiver_id: str = Depends(get_caregiver_id),
    reminder_facade: ReminderFacade = Depends(get_reminder_facade),
):
    """Update an existing reminder.

    Updates a reminder's details. Only the authenticated caregiver who
    created the reminder can update it. Supports partial updates
    (only provided fields are updated).

    Args:
        reminder_id (UUID): Unique identifier of the reminder to update
        request (ReminderUpdate): Updated reminder data (all fields optional)
        caregiver_id (str): ID of the authenticated caregiver
            (extracted from JWT token)
        reminder_facade (ReminderFacade): Reminder service facade

    Returns:
        ReminderResponse: The updated reminder

    Raises:
        HTTPException: 404 if reminder not found,
                      403 if caregiver doesn't have access to reminder,
                      400 for validation errors,
                      500 if update fails
    """
    try:
        # First verify the reminder exists and caregiver has access
        reminder = reminder_facade.get_reminder(str(reminder_id))

        if not reminder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reminder not found",
            )

        # Verify that this caregiver has access to this reminder
        if UUID(caregiver_id) != reminder.caregiver_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this reminder",
            )

        # Build update data from provided fields only
        update_data = {}
        if request.title is not None:
            update_data["title"] = request.title
        if request.description is not None:
            update_data["description"] = request.description
        if request.scheduled_at is not None:
            update_data["scheduled_at"] = request.scheduled_at

        # If no fields to update, return current data
        if not update_data:
            return build_reminder_response(reminder)

        # Perform update — pass as str to avoid UUID(uuid_obj) crash in facade
        updated_reminder = reminder_facade.update_reminder(
            str(reminder.id), update_data
        )
        return build_reminder_response(updated_reminder)

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update reminder: {str(e)}",
        )


@router.put("/{reminder_id}/postpone", response_model=ReminderResponse)
async def postpone_reminder(
    reminder_id: UUID,
    delay_minutes: int = Body(default=5, embed=True),
    reminder_facade: ReminderFacade = Depends(get_reminder_facade),
):
    """Postpone a reminder by a given number of minutes.

    Updates the reminder's scheduled_at to now + delay_minutes and
    creates a POSTPONED status entry. Called by the user from the
    notification screen.

    Args:
        reminder_id (UUID): Unique identifier of the reminder to postpone
        delay_minutes (int): Number of minutes to postpone (default: 5)
        reminder_facade (ReminderFacade): Reminder service facade

    Returns:
        ReminderResponse: The updated reminder

    Raises:
        HTTPException: 404 if reminder not found, 500 if update fails
    """
    try:
        reminder = reminder_facade.postpone_reminder(str(reminder_id), delay_minutes)
        if not reminder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reminder not found",
            )
        return build_reminder_response(reminder)

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to postpone reminder: {str(e)}",
        )


@router.delete(
    "/{reminder_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete reminder",
    description="""
    Permanently delete a reminder from the system.
    
    Only the caregiver who created the reminder can delete it.
    
    **Authentication required:** Bearer token (caregiver)
    
    **Access control:**
    - Only the caregiver who created the reminder can delete it
    - Returns 403 Forbidden if access is denied
    
    **Warning:** This action cannot be undone!
    
    **What gets deleted:**
    - The reminder itself
    - Associated reminder status records
    - Any pending notifications for this reminder
    """,
    responses={
        204: {"description": "Reminder deleted successfully (no content returned)"},
        401: {
            "description": "Unauthorized - Invalid or expired token",
            "content": {
                "application/json": {
                    "example": {"detail": "Could not validate credentials"}
                }
            },
        },
        403: {
            "description": "Forbidden - No access to this reminder",
            "content": {
                "application/json": {
                    "example": {"detail": "You don't have access to this reminder"}
                }
            },
        },
        404: {
            "description": "Reminder not found",
            "content": {
                "application/json": {"example": {"detail": "reminder not found"}}
            },
        },
        500: {
            "description": "Internal server error",
            "content": {
                "application/json": {"example": {"detail": "Failed to delete reminder"}}
            },
        },
    },
)
async def delete_reminder(
    reminder_id: UUID,
    caregiver_id: str = Depends(get_caregiver_id),
    reminder_facade: ReminderFacade = Depends(get_reminder_facade),
):
    """Delete a reminder.

    Permanently deletes a reminder. Only the authenticated caregiver
    who created the reminder can delete it.

    Args:
        reminder_id (UUID): Unique identifier of the reminder to delete
        caregiver_id (str): ID of the authenticated caregiver
            (extracted from JWT token)
        reminder_facade (ReminderFacade): Reminder service facade

    Returns:
        None: 204 No Content on successful deletion

    Raises:
        HTTPException: 404 if reminder not found,
                      403 if caregiver doesn't have access to reminder,
                      500 if deletion fails
    """
    try:
        # First verify the reminder exists and caregiver has access
        reminder = reminder_facade.get_reminder(str(reminder_id))

        if not reminder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="reminder not found",
            )

        # Verify that this caregiver has access to this reminder
        if UUID(caregiver_id) != reminder.caregiver_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this reminder",
            )

        # Delete the reminder
        success = reminder_facade.delete_reminder(str(reminder_id))

        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete reminder",
            )
        return None

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete reminder: {str(e)}",
        )


# Export for use in other modules
__all__ = ["router"]
