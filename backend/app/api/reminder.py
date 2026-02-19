"""
Docstring for api reminder
/get{id}
/get{user_id}
/get{caregiver_id}
/get all
/post
/put
/delete
Attributes reminder :
    id (UUID): Unique identifier for the reminder
    title (str): Brief description of the reminder (max 200 chars)
    description (str): Detailed description (optional, unlimited length)
    scheduled_at (datetime): When the reminder should trigger
    caregiver_id (UUID): ID of the caregiver who created the reminder
    user_id (UUID): ID of the user this reminder is for
    created_at (datetime): Timestamp of reminder creation
    updated_at (datetime): Timestamp of last update
"""

from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from app.services.reminder_facade import ReminderFacade
from app.schemas.reminder_schema import ReminderResponse, ReminderCreate
from app.services.user_facade import UserFacade
from app.api.authentication import verify_token
from app import get_db
from uuid import UUID

router = APIRouter(prefix="/api/reminder", tags=["Reminder"])

def get_reminder_facade(db: Session = Depends(get_db)) -> ReminderFacade:
    """Dependency to create ReminderFacade instance with database session."""
    return ReminderFacade(db)

def get_reminder_facade(db: Session = Depends(get_db)) -> ReminderFacade:
    """Dependency to create ReminderFacade instance with database session."""
    return ReminderFacade(db)


@router.post("", response_model=ReminderResponse)
async def create_reminder(
    request: ReminderCreate,
    caregiver_id: str = Depends(lambda token=Depends(verify_token): token.get("sub")),
    reminder_facade: ReminderFacade = Depends(get_reminder_facade),
    user_facade: UserFacade = Depends(get_user_facade)
):
    try:
        user = user_facade.get_user(request.user_id)
        if not user or UUID(caregiver_id) not in user.caregiver_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this user"
            )

        reminder_data = {
            "title": request.title,
            "description": request.description,
            "scheduled_at": request.scheduled_at,
            "user_id": request.user_id,
            "caregiver_id": UUID(caregiver_id)
        }
        
        reminder = reminder_facade.create_reminder(reminder_data, UUID(caregiver_id))

        return {
            "title": reminder.title,
            "description": reminder.description,
            "scheduled_at": reminder.scheduled_at,
            "user_id": reminder.user_id,
            "caregiver_id": reminder.caregiver_id,
            "created_at": reminder.created_at.isoformat(),
            "updated_at": reminder.updated_at.isoformat()
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
            detail=f"Failed to create reminder: {str(e)}"
        )
