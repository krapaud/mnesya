"""Reminder Status API module.

This module provides endpoints for managing reminder statuses.
Statuses track the lifecycle of reminders (PENDING, DONE, POSTPONED, UNABLE).
"""

from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from app.services.reminder_status_facade import ReminderStatusFacade
from app.services.caregiver_facade import CaregiverFacade
from app.services.reminder_facade import ReminderFacade
from app.schemas.reminder_status_schema import (
    ReminderStatusResponse,
    ReminderStatusUpdate,
    ActivityLogEntry,
)
from app.models.reminder_status_enum import ReminderStatusEnum
from app.api.authentication import verify_token
from app import get_db
from uuid import UUID
from typing import List

router = APIRouter(prefix="/api/reminder-status", tags=["Reminder Status"])


def get_caregiver_facade(db: Session = Depends(get_db)) -> CaregiverFacade:
    """Dependency to create CaregiverFacade instance with database session."""
    return CaregiverFacade(db)


def get_reminder_status_facade(
    db: Session = Depends(get_db),
) -> ReminderStatusFacade:
    """Dependency to create ReminderStatusFacade instance with database session."""
    return ReminderStatusFacade(db)


def get_reminder_facade(db: Session = Depends(get_db)) -> ReminderFacade:
    """Dependency to create ReminderFacade instance with database session."""
    return ReminderFacade(db)


@router.get(
    "/{reminder_id}/current",
    response_model=ReminderStatusResponse,
    summary="Get current reminder status",
    description="""
    Retrieve the current (most recent) status of a specific reminder.
    
    Returns the latest status entry for the reminder. This represents the
    current state of the reminder in the system.
    
    **Authentication required:** Bearer token (caregiver or user)
    
    **Possible status values:**
    - PENDING: Reminder is scheduled and waiting
    - DONE: Reminder has been completed
    - POSTPONED: Reminder has been postponed
    - UNABLE: User was unable to complete the reminder
    
    **Use cases:**
    - Display current reminder status in the UI
    - Check if a reminder has been completed
    - Determine if action is needed
    """,
    responses={
        200: {
            "description": "Current status retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "id": "123e4567-e89b-12d3-a456-426614174000",
                        "status": "PENDING",
                        "reminder_id": "456e7890-e89b-12d3-a456-426614174000",
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
            "description": "No status found for this reminder",
            "content": {
                "application/json": {
                    "example": {"detail": "No status found for this reminder"}
                }
            },
        },
        500: {
            "description": "Internal server error",
            "content": {
                "application/json": {"example": {"detail": "Failed to retrieve status"}}
            },
        },
    },
)
async def get_current_status(
    reminder_id: UUID,
    user_id: str = Depends(lambda token=Depends(verify_token): token.get("sub")),
    facade: ReminderStatusFacade = Depends(get_reminder_status_facade),
):
    """Get the current status of a reminder.

    Returns the most recent status entry for the specified reminder.

    Args:
        reminder_id (UUID): Unique identifier of the reminder
        user_id (str): ID of the authenticated user (from JWT token)
        facade (ReminderStatusFacade): Status service facade

    Returns:
        ReminderStatusResponse: The current status of the reminder

    Raises:
        HTTPException: 404 if no status found for reminder
    """
    try:
        current_status = facade.get_latest_status(reminder_id)

        if not current_status:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No status found for this reminder",
            )

        return ReminderStatusResponse(
            id=current_status.id,
            status=current_status.status,
            reminder_id=current_status.reminder_id,
            created_at=current_status.created_at,
            updated_at=current_status.updated_at,
        )

    except HTTPException:
        raise
    except Exception as e:
        import traceback

        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve status: {str(e)}",
        )


@router.get(
    "/{reminder_id}/history",
    response_model=List[ReminderStatusResponse],
    summary="Get reminder status history",
    description="""
    Retrieve the complete status change history for a reminder.
    
    Returns all status entries for the reminder in chronological order
    (newest first). This provides a complete audit trail of all status
    changes throughout the reminder's lifecycle.
    
    **Authentication required:** Bearer token (caregiver or user)
    
    **History includes:**
    - All status changes from creation to present
    - Timestamps for each status change
    - Ordered from newest to oldest
    
    **Use cases:**
    - Display status change timeline
    - Audit reminder completion history
    - Track user behavior patterns
    - Generate compliance reports
    
    **Example sequence:**
    1. PENDING (created)
    2. POSTPONED (user postponed)
    3. PENDING (rescheduled)
    4. DONE (completed)
    """,
    responses={
        200: {
            "description": "Status history retrieved successfully",
            "content": {
                "application/json": {
                    "example": [
                        {
                            "id": "323e4567-e89b-12d3-a456-426614174000",
                            "status": "DONE",
                            "reminder_id": "456e7890-e89b-12d3-a456-426614174000",
                            "created_at": "2026-02-27T14:05:00Z",
                            "updated_at": "2026-02-27T14:05:00Z",
                        },
                        {
                            "id": "223e4567-e89b-12d3-a456-426614174001",
                            "status": "POSTPONED",
                            "reminder_id": "456e7890-e89b-12d3-a456-426614174000",
                            "created_at": "2026-02-27T13:00:00Z",
                            "updated_at": "2026-02-27T13:00:00Z",
                        },
                        {
                            "id": "123e4567-e89b-12d3-a456-426614174000",
                            "status": "PENDING",
                            "reminder_id": "456e7890-e89b-12d3-a456-426614174000",
                            "created_at": "2026-02-27T10:30:00Z",
                            "updated_at": "2026-02-27T10:30:00Z",
                        },
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
                    "example": {"detail": "Failed to retrieve status history"}
                }
            },
        },
    },
)
async def get_status_history(
    reminder_id: UUID,
    user_id: str = Depends(lambda token=Depends(verify_token): token.get("sub")),
    facade: ReminderStatusFacade = Depends(get_reminder_status_facade),
):
    """Get the complete status history of a reminder.

    Returns all status entries for the reminder, ordered from newest to oldest.
    This provides a complete audit trail of status changes.

    Args:
        reminder_id (UUID): Unique identifier of the reminder
        user_id (str): ID of the authenticated user (from JWT token)
        facade (ReminderStatusFacade): Status service facade

    Returns:
        List[ReminderStatusResponse]: List of all status entries (newest first)

    Raises:
        HTTPException: 500 if retrieval fails
    """
    try:
        statuses = facade.get_statuses_by_reminder(reminder_id)

        return [
            ReminderStatusResponse(
                id=s.id,
                status=s.status,
                reminder_id=s.reminder_id,
                created_at=s.created_at,
                updated_at=s.updated_at,
            )
            for s in statuses
        ]

    except Exception as e:
        import traceback

        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve status history: {str(e)}",
        )


@router.put(
    "/{reminder_id}",
    response_model=ReminderStatusResponse,
    summary="Update reminder status",
    description="""
    Update the status of a reminder to track its lifecycle.
    
    Creates a new status entry while preserving the complete history of
    previous statuses. This allows tracking of all status changes over time
    for audit and analytics purposes.
    
    **Authentication required:** Bearer token (caregiver or user)
    
    **Valid status values:**
    - **PENDING**: Reminder is scheduled and waiting to be completed
    - **DONE**: Reminder has been successfully completed by the user
    - **POSTPONED**: User has postponed the reminder to a later time
    - **UNABLE**: User was unable to complete the reminder
    
    **Behavior:**
    - Creates a NEW status entry (doesn't modify existing)
    - Preserves complete history of all status changes
    - Latest entry becomes the "current" status
    
    **Common workflows:**
    1. Reminder created → PENDING
    2. User completes task → DONE
    3. User can't do it now → POSTPONED
    4. User unable to complete → UNABLE
    
    **Use cases:**
    - Mark reminder as completed
    - Postpone to later time
    - Record inability to complete
    - Track user compliance
    """,
    responses={
        200: {
            "description": "Status updated successfully (new status entry created)",
            "content": {
                "application/json": {
                    "example": {
                        "id": "223e4567-e89b-12d3-a456-426614174001",
                        "status": "DONE",
                        "reminder_id": "456e7890-e89b-12d3-a456-426614174000",
                        "created_at": "2026-02-27T14:05:00Z",
                        "updated_at": "2026-02-27T14:05:00Z",
                    }
                }
            },
        },
        400: {
            "description": "Bad request - Invalid status value",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Invalid status value. Must be one of: PENDING, DONE, POSTPONED, UNABLE"
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
        500: {
            "description": "Internal server error",
            "content": {
                "application/json": {"example": {"detail": "Failed to update status"}}
            },
        },
    },
)
async def update_reminder_status(
    reminder_id: UUID,
    request: ReminderStatusUpdate,
    user_id: str = Depends(lambda token=Depends(verify_token): token.get("sub")),
    facade: ReminderStatusFacade = Depends(get_reminder_status_facade),
    reminder_facade: ReminderFacade = Depends(get_reminder_facade),
):
    """Update the status of a reminder.

    Creates a new status entry rather than modifying the existing one,
    maintaining a complete history of status changes. Valid statuses are:
    - PENDING: Reminder is scheduled and waiting
    - DONE: Reminder has been completed
    - POSTPONED: Reminder has been postponed
    - UNABLE: User was unable to complete the reminder

    For recurring reminders, a DONE or UNABLE status automatically advances
    scheduled_at to the next matching day of week.

    Args:
        reminder_id (UUID): Unique identifier of the reminder
        request (ReminderStatusUpdate): New status value
        user_id (str): ID of the authenticated user (from JWT token)
        facade (ReminderStatusFacade): Status service facade
        reminder_facade (ReminderFacade): Reminder service facade

    Returns:
        ReminderStatusResponse: The newly created status entry

    Raises:
        HTTPException: 400 for validation errors, 500 if update fails
    """
    try:
        # Create new status entry (preserves history)
        status_data = {"status": request.status, "reminder_id": reminder_id}

        new_status = facade.create_reminder_status(status_data)

        # Advance recurring reminders to their next occurrence
        if request.status in ("DONE", "UNABLE"):
            reminder_facade.advance_recurrence(reminder_id)

        return ReminderStatusResponse(
            id=new_status.id,
            status=new_status.status,
            reminder_id=new_status.reminder_id,
            created_at=new_status.created_at,
            updated_at=new_status.updated_at,
        )

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        import traceback

        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update status: {str(e)}",
        )


@router.get(
    "/caregiver/recent",
    response_model=List[ActivityLogEntry],
    summary="Get recent activity log for the caregiver",
    description="""
    Returns all user interactions on reminders (DONE, POSTPONED, UNABLE, MISSED)
    across all reminders managed by the authenticated caregiver, over the last 48 hours.

    Results are ordered newest first.

    **Authentication required:** Bearer token (caregiver)
    """,
    responses={
        200: {
            "description": "Activity log retrieved successfully",
            "content": {
                "application/json": {
                    "example": [
                        {
                            "status_id": "123e4567-e89b-12d3-a456-426614174000",
                            "status": "DONE",
                            "reminder_id": "456e7890-e89b-12d3-a456-426614174000",
                            "reminder_title": "Take medications",
                            "user_first_name": "Marie",
                            "user_last_name": "Dupont",
                            "occurred_at": "2026-03-04T10:30:00Z",
                        }
                    ]
                }
            },
        },
        401: {
            "description": "Unauthorized",
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
                    "example": {"detail": "Failed to retrieve activity log"}
                }
            },
        },
    },
)
async def get_caregiver_activity_log(
    token_payload: dict = Depends(verify_token),
    facade: ReminderStatusFacade = Depends(get_reminder_status_facade),
    caregiver_facade: CaregiverFacade = Depends(get_caregiver_facade),
):
    """Get the activity log for the authenticated caregiver.

    Returns all DONE/POSTPONED/UNABLE/MISSED interactions across all reminders
    managed by this caregiver. Free plan: last 48 hours. Premium: last 30 days.

    Args:
        token_payload (dict): JWT payload with caregiver ID under 'sub'.
        facade (ReminderStatusFacade): Status service facade.
        caregiver_facade (CaregiverFacade): Caregiver service facade.

    Returns:
        List[ActivityLogEntry]: Enriched status entries for the activity log.

    Raises:
        HTTPException: 500 if retrieval fails.
    """
    try:
        caregiver_id = token_payload.get("sub")
        caregiver = caregiver_facade.get_caregiver(caregiver_id)
        hours = 720 if caregiver and caregiver.plan == "premium" else 48
        entries = facade.get_recent_activity(caregiver_id, hours=hours)

        return [
            ActivityLogEntry(
                status_id=e.id,
                status=e.status,
                reminder_id=e.reminder_id,
                reminder_title=e.reminder_title,
                user_first_name=e.user_first_name,
                user_last_name=e.user_last_name,
                occurred_at=e.created_at,
            )
            for e in entries
        ]
    except Exception as e:
        import traceback

        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve activity log: {str(e)}",
        )


@router.get(
    "/valid-statuses",
    response_model=List[str],
    description="""
    Retrieve the list of all valid reminder status values.
    
    Returns reference data for the possible status values that can be set
    on a reminder. This endpoint is useful for:
    - Populating dropdown menus
    - Validating status inputs
    - Displaying available options to users
    
    **No authentication required** - This is reference data
    
    **Status definitions:**
    - **PENDING**: Initial state, reminder is scheduled and waiting
    - **DONE**: Task has been completed successfully
    - **POSTPONED**: User has postponed the reminder
    - **UNABLE**: User was unable to complete the task
    
    **Use cases:**
    - Initialize status selector UI components
    - Validate status before API calls
    - Display status legends/help text
    """,
    responses={
        200: {
            "description": "List of valid status values",
            "content": {
                "application/json": {
                    "example": ["PENDING", "DONE", "POSTPONED", "UNABLE"]
                }
            },
        }
    },
)
async def get_valid_statuses():
    """Get the list of valid reminder statuses.

    Returns all possible status values that can be set on a reminder.
    This endpoint does not require authentication as it's just reference data.

    Returns:
        List[str]: List of valid status values (PENDING, DONE, POSTPONED, UNABLE)
    """
    return ReminderStatusEnum.values()


# Export for use in other modules
__all__ = ["router"]
