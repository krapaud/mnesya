import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy.orm import Session

from app.persistence.reminder_repository import ReminderRepository
from app.persistence.push_token_repository import PushTokenRepository
from app.services.notification_services import NotificationService

logger = logging.getLogger(__name__)


def send_user_notifications() -> None:
    from app import SessionLocal
    db: Session = SessionLocal()
    try:
        reminder_repo = ReminderRepository(db)
        push_token_repo = PushTokenRepository(db)
        notification_service = NotificationService()

        reminders = reminder_repo.get_reminders_due_now(window_seconds=60)

        for reminder in reminders:
            tokens = [t.token for t in push_token_repo.get_active_tokens_by_user(reminder.user_id)]
            if not tokens:
                continue
            notification_service.send_reminder_notification(
                tokens=tokens,
                reminder_title=reminder.title,
                reminder_description=reminder.description,
                reminder_id=str(reminder.id),
                extra_data={"isUserNotification": True}
            )
    except Exception as e:
        logger.error(f"[Scheduler] Error in send_user_notifications: {e}")
    finally:
        db.close()


def send_user_retry(offset_minutes: int) -> None:
    from app import SessionLocal
    db: Session = SessionLocal()
    try:
        reminder_repo = ReminderRepository(db)
        push_token_repo = PushTokenRepository(db)
        notification_service = NotificationService()

        reminders = reminder_repo.get_reminders_at_offset(offset_minutes=offset_minutes)

        for reminder in reminders:
            tokens = [t.token for t in push_token_repo.get_active_tokens_by_user(reminder.user_id)]
            if not tokens:
                continue
            notification_service.send_reminder_notification(
                tokens=tokens,
                reminder_title=reminder.title,
                reminder_description=reminder.description,
                reminder_id=str(reminder.id),
                extra_data={"isUserNotification": True, "retry": offset_minutes}
            )
    except Exception as e:
        logger.error(f"[Scheduler] Error in send_user_retry: {e}")
    finally:
        db.close()


def send_caregiver_escalations():
    from app import SessionLocal
    db: Session = SessionLocal()
    try:
        reminder_repo = ReminderRepository(db)
        push_token_repo = PushTokenRepository(db)
        notification_service = NotificationService()

        reminders = reminder_repo.get_reminders_to_escalate()

        for reminder in reminders:
            token_objects = push_token_repo.get_active_tokens_by_caregiver(reminder.caregiver_id)
            if not token_objects:
                continue
            token_strings = [t.token for t in token_objects]
            my_locale = token_objects[0].locale if token_objects else "fr"

            if my_locale == "fr":
                my_title = reminder.title
                my_body = f"Votre proche n'a pas confirmé : {reminder.title}"
            else:
                my_title = reminder.title
                my_body = f"Your relative did not confirm: {reminder.title}"

            notification_service.send_notification(
                tokens=token_strings,
                title=my_title,
                body=my_body,
                data={"type": "caregiver_alert", "reminder_id": str(reminder.id)}
            )
    except Exception as e:
        logger.error(f"[Scheduler] Error in send_caregiver_escalations: {e}")
    finally:
        db.close()


def start_scheduler():
    my_scheduler = BackgroundScheduler()

    my_scheduler.add_job(
        send_user_notifications,
        IntervalTrigger(seconds=60),
        id="send_user_notifications"
    )

    my_scheduler.add_job(
        lambda: send_user_retry(2),
        IntervalTrigger(seconds=60),
        id="send_user_retry_2min"
    )

    my_scheduler.add_job(
        lambda: send_user_retry(5),
        IntervalTrigger(seconds=60),
        id="send_user_retry_5min"
    )

    my_scheduler.add_job(
        send_caregiver_escalations,
        IntervalTrigger(seconds=60),
        id="send_caregiver_escalations"
    )

    my_scheduler.start()
    logger.info("[Scheduler] Started")
