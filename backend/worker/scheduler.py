"""Scheduler module for automated push notification delivery.

This module defines background jobs that run every 60 seconds to:
- Send initial push notifications to users when a reminder is due (T+0)
- Retry notifications if the user has not responded (T+5)
- Escalate to the caregiver if still no response after 10 minutes (T+10)

The scheduler uses APScheduler's BackgroundScheduler with IntervalTrigger.
Each job opens its own database session to avoid circular import issues.
"""
import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy.orm import Session

from app.persistence.reminder_repository import ReminderRepository
from app.persistence.push_token_repository import PushTokenRepository
from app.persistence.reminder_status_repository import ReminderStatusRepository
from app.services.notification_services import NotificationService

logger = logging.getLogger(__name__)


def send_user_notifications() -> None:
    """Send initial push notifications for reminders due now (T+0).

    Queries reminders scheduled within the last 60 seconds and sends
    a push notification to the user's registered devices.
    """
    from app import SessionLocal
    db: Session = SessionLocal()
    try:
        reminder_repo = ReminderRepository(db)
        push_token_repo = PushTokenRepository(db)
        notification_service = NotificationService()

        reminders = reminder_repo.get_reminders_due_now(window_seconds=60)
        logger.info(f"[Scheduler] send_user_notifications: {len(reminders)} reminders due")

        for reminder in reminders:
            tokens = [t.token for t in push_token_repo.get_active_tokens_by_user(reminder.user_id)]
            logger.info(f"[Scheduler] reminder {reminder.id}: {len(tokens)} user token(s)")
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
    """Retry push notification for reminders that have not been confirmed.

    Called at T+5 minutes after the original scheduled time.

    Args:
        offset_minutes (int): Number of minutes after scheduled_at to target.
    """
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
    """Escalate unconfirmed reminders to the caregiver (T+10).

    Queries reminders that are still pending 10 minutes after their scheduled
    time and sends a localized alert to the caregiver's registered devices.
    The notification language is determined by the caregiver's device locale.
    """
    from app import SessionLocal
    db: Session = SessionLocal()
    try:
        reminder_repo = ReminderRepository(db)
        push_token_repo = PushTokenRepository(db)
        reminder_status_repo = ReminderStatusRepository(db)
        notification_service = NotificationService()

        reminders = reminder_repo.get_reminders_to_escalate()
        logger.info(f"[Scheduler] send_caregiver_escalations: {len(reminders)} reminders to escalate")

        for reminder in reminders:
            token_objects = push_token_repo.get_active_tokens_by_caregiver(reminder.caregiver_id)

            # Send notification to caregiver only if they have registered tokens
            if token_objects:
                token_strings = [t.token for t in token_objects]
                my_locale = token_objects[0].locale if token_objects else "fr"

                user_name = f"{getattr(reminder, 'user_first_name', '')} {getattr(reminder, 'user_last_name', '')}".strip()
                if my_locale == "fr":
                    my_title = reminder.title
                    my_body = f"⚠️ {user_name} n'a pas répondu à : {reminder.title}"
                else:
                    my_title = reminder.title
                    my_body = f"⚠️ {user_name} has not responded to: {reminder.title}"

                notification_service.send_notification(
                    tokens=token_strings,
                    title=my_title,
                    body=my_body,
                    data={"type": "caregiver_alert", "reminder_id": str(reminder.id)}
                )

            # Always mark reminder as MISSED, even if no caregiver token exists
            from app.models.reminder_status import ReminderStatusModel
            missed_status = ReminderStatusModel()
            missed_status.status = "MISSED"
            missed_status.reminder_id = reminder.id
            logger.info(f"[Scheduler] Creating MISSED status for reminder {reminder.id}")
            result = reminder_status_repo.add(missed_status)
            logger.info(f"[Scheduler] MISSED status created: {result.id}")
    except Exception as e:
        import traceback
        logger.error(f"[Scheduler] Error in send_caregiver_escalations: {e}\n{traceback.format_exc()}")
    finally:
        db.close()


def start_scheduler():
    """Initialize and start the APScheduler background scheduler.

    Registers 3 jobs, all running every 60 seconds:
    - send_user_notifications: initial notification at T+0
    - send_user_retry(5): retry at T+5 minutes
    - send_caregiver_escalations: caregiver alert at T+10 minutes
    """
    my_scheduler = BackgroundScheduler()

    my_scheduler.add_job(
        send_user_notifications,
        IntervalTrigger(seconds=60),
        id="send_user_notifications"
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
    return my_scheduler


if __name__ == "__main__":
    import time
    import os
    import sys
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
        stream=sys.stdout,
    )
    from app import init_app
    init_app(os.environ["DATABASE_URL"])
    scheduler = start_scheduler()
    try:
        while True:
            time.sleep(60)
    except (KeyboardInterrupt, SystemExit):
        scheduler.shutdown()
        logger.info("[Scheduler] Stopped")
