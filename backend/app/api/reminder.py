"""Reminder API module.

This module provides endpoints for managing reminders associated with users.
Caregivers can create, read, update, and delete reminders for their users.
"""

import traceback
from uuid import UUID
from typing import List

from fastapi import APIRouter, HTTPException, Depends, status
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
        user_first_name=getattr(reminder, 'user_first_name', None),
        user_last_name=getattr(reminder, 'user_last_name', None),
        created_at=reminder.created_at,
        updated_at=reminder.updated_at,
    )


@router.get("/caregiver", response_model=List[ReminderResponse])
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
        reminders = reminder_facade.get_reminder_by_caregiver(
            UUID(caregiver_id)
        )
        return [build_reminder_response(r) for r in reminders]

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve reminders: {str(e)}",
        )


@router.get("/user", response_model=List[ReminderResponse])
async def get_all_reminder_by_user(
    user_id: str = Depends(get_caregiver_id),
    reminder_facade: ReminderFacade = Depends(get_reminder_facade),
):
    """Get all reminders for the authenticated user.

    Retrieves all reminders that are assigned to the currently
    authenticated user.

    Args:
        user_id (str): ID of the authenticated user
            (extracted from JWT token)
        reminder_facade (ReminderFacade): Reminder service facade

    Returns:
        List[ReminderResponse]: List of reminders assigned to the user

    Raises:
        HTTPException: If retrieval fails with 500 status code
    """
    try:
        reminders = reminder_facade.get_reminder_by_user(UUID(user_id))
        return [build_reminder_response(r) for r in reminders]

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve reminders: {str(e)}",
        )


@router.get("/{reminder_id}", response_model=ReminderResponse)
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


@router.post("", response_model=ReminderResponse)
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


@router.put("/{reminder_id}", response_model=ReminderResponse)
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

        # Perform update
        updated_reminder = reminder_facade.update_reminder(
            reminder.id, update_data
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


@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
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

