"""Reminder Status API module.

This module provides endpoints for managing reminder statuses.
Statuses track the lifecycle of reminders (PENDING, DONE, POSTPONED, UNABLE).
"""

from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from app.services.reminder_status_facade import ReminderStatusFacade
from app.schemas.reminder_status_schema import (
    ReminderStatusResponse,
    ReminderStatusUpdate
)
from app.models.reminder_status_enum import ReminderStatusEnum
from app.api.authentication import verify_token
from app import get_db
from uuid import UUID
from typing import List

router = APIRouter(prefix="/api/reminder-status", tags=["Reminder Status"])


def get_reminder_status_facade(db: Session = Depends(get_db)) -> ReminderStatusFacade:
    """Dependency to create ReminderStatusFacade instance with database session."""
    return ReminderStatusFacade(db)


@router.get("/{reminder_id}/current", response_model=ReminderStatusResponse)
async def get_current_status(
    reminder_id: UUID,
    user_id: str = Depends(lambda token=Depends(verify_token): token.get("sub")),
    facade: ReminderStatusFacade = Depends(get_reminder_status_facade)
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
                detail="No status found for this reminder"
            )
        
        return ReminderStatusResponse(
            id=current_status.id,
            status=current_status.status,
            reminder_id=current_status.reminder_id,
            created_at=current_status.created_at,
            updated_at=current_status.updated_at
        )
    
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve status: {str(e)}"
        )


@router.get("/{reminder_id}/history", response_model=List[ReminderStatusResponse])
async def get_status_history(
    reminder_id: UUID,
    user_id: str = Depends(lambda token=Depends(verify_token): token.get("sub")),
    facade: ReminderStatusFacade = Depends(get_reminder_status_facade)
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
                updated_at=s.updated_at
            )
            for s in statuses
        ]
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve status history: {str(e)}"
        )


@router.put("/{reminder_id}", response_model=ReminderStatusResponse)
async def update_reminder_status(
    reminder_id: UUID,
    request: ReminderStatusUpdate,
    user_id: str = Depends(lambda token=Depends(verify_token): token.get("sub")),
    facade: ReminderStatusFacade = Depends(get_reminder_status_facade)
):
    """Update the status of a reminder.
    
    Creates a new status entry rather than modifying the existing one,
    maintaining a complete history of status changes. Valid statuses are:
    - PENDING: Reminder is scheduled and waiting
    - DONE: Reminder has been completed
    - POSTPONED: Reminder has been postponed
    - UNABLE: User was unable to complete the reminder
    
    Args:
        reminder_id (UUID): Unique identifier of the reminder
        request (ReminderStatusUpdate): New status value
        user_id (str): ID of the authenticated user (from JWT token)
        facade (ReminderStatusFacade): Status service facade
        
    Returns:
        ReminderStatusResponse: The newly created status entry
        
    Raises:
        HTTPException: 400 for validation errors, 500 if update fails
    """
    try:
        # Create new status entry (preserves history)
        status_data = {
            "status": request.status,
            "reminder_id": reminder_id
        }
        
        new_status = facade.create_reminder_status(status_data)
        
        return ReminderStatusResponse(
            id=new_status.id,
            status=new_status.status,
            reminder_id=new_status.reminder_id,
            created_at=new_status.created_at,
            updated_at=new_status.updated_at
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
            detail=f"Failed to update status: {str(e)}"
        )


@router.get("/valid-statuses", response_model=List[str])
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
