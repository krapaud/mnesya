# Flow (every 60s):
# T+0  : initial notification at scheduled time → USER
# T+2  : retry if still PENDING → USER
# T+5  : retry if still PENDING → USER
# T+10 : escalate if PENDING or POSTPONED → CAREGIVER

import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy.orm import Session

from app.persistence.reminder_repository import ReminderRepository
from app.persistence.push_token_repository import PushTokenRepository
from app.models.user import UserModel
from app.services.notification_services import NotificationService



logger = logging.getLogger(__name__)


def send_user_notifications() -> None:
    from app import SessionLocal
    if SessionLocal is None:
        logger.warning("[Scheduler] SessionLocal not ready yet, skipping send_user_notifications")
        return
    db: Session = SessionLocal()
    try:
        reminder_repo = ReminderRepository(db)
        push_token_repo = PushTokenRepository(db)
        notification_service = NotificationService()

        reminders = reminder_repo.get_reminders_due_now(window_seconds=60)
        logger.info(f"{len(reminders)} reminder(s) due now")

        for reminder in reminders:
            token_records = push_token_repo.get_active_tokens_by_user(reminder.user_id)
            tokens = [t.token for t in token_records]

            if not tokens:
                logger.warning(f"No push tokens for user {reminder.user_id}")
                continue

            result = notification_service.send_reminder_notification(
                tokens=tokens,
                reminder_title=reminder.title,
                reminder_description=reminder.description,
                reminder_id=str(reminder.id),
                extra_data={"isUserNotification": True}
            )
            logger.info(f"[Scheduler] User notification sent for reminder {reminder.id}: {result}")

    except Exception as e:
        logger.error(f"[Scheduler] Error in send_user_notifications: {e}")
    finally:
        db.close()


def send_user_retry(offset_minutes: int) -> None:
    from app import SessionLocal
    if SessionLocal is None:
        logger.warning(f"[Scheduler] SessionLocal not ready yet, skipping retry +{offset_minutes}min")
        return
    db: Session = SessionLocal()
    try:
        reminder_repo = ReminderRepository(db)
        push_token_repo = PushTokenRepository(db)
        notification_service = NotificationService()

        reminders = reminder_repo.get_reminders_at_offset(
            offset_minutes=offset_minutes,
            statuses=["PENDING"]
        )
        logger.info(f"[Scheduler] {len(reminders)} reminder(s) to retry at +{offset_minutes}min")

        for reminder in reminders:
            token_records = push_token_repo.get_active_tokens_by_user(reminder.user_id)
            tokens = [t.token for t in token_records]

            if not tokens:
                logger.warning(f"[Scheduler] No push tokens for user {reminder.user_id} (retry +{offset_minutes}min)")
                continue

            result = notification_service.send_reminder_notification(
                tokens=tokens,
                reminder_title=reminder.title,
                reminder_description=reminder.description,
                reminder_id=str(reminder.id),
                extra_data={"isUserNotification": True, "retry": offset_minutes}
            )
            logger.info(f"[Scheduler] Retry +{offset_minutes}min sent for reminder {reminder.id}: {result}")

    except Exception as e:
        logger.error(f"[Scheduler] Error in send_user_retry +{offset_minutes}min: {e}")
    finally:
        db.close()


def send_caregiver_escalations() -> None:
    from app import SessionLocal
    if SessionLocal is None:
        logger.warning("[Scheduler] SessionLocal not ready yet, skipping send_caregiver_escalations")
        return
    db: Session = SessionLocal()
    try:
        reminder_repo = ReminderRepository(db)
        push_token_repo = PushTokenRepository(db)
        notification_service = NotificationService()

        reminders = reminder_repo.get_reminders_to_escalate(delay_minutes=10)
        logger.info(f"[Scheduler] {len(reminders)} reminder(s) to escalate to caregiver")

        for reminder in reminders:
            # only escalate if the user has the app
            user_tokens = push_token_repo.get_active_tokens_by_user(reminder.user_id)
            if not user_tokens:
                continue

            caregiver_tokens = push_token_repo.get_active_tokens_by_caregiver(reminder.caregiver_id)
            tokens = [t.token for t in caregiver_tokens]

            if not tokens:
                logger.warning(f"[Scheduler] No push tokens for caregiver {reminder.caregiver_id}")
                continue

            user = db.query(UserModel).filter(UserModel._id == reminder.user_id).first()
            user_name = user.first_name if user else "The user"

            lang = caregiver_tokens[0].locale if caregiver_tokens else 'fr'
            if lang == 'en':
                title = f'⚠️ {user_name} did not respond'
                body = f"Reminder '{reminder.title}' was not acknowledged after 10 minutes."
            else:
                title = f'⚠️ {user_name} n\'a pas répondu'
                body = f"Le rappel '{reminder.title}' n'a pas été confirmé après 10 minutes."

            result = notification_service.send_notification(
                tokens=tokens,
                title=title,
                body=body,
                data={
                    "type": "caregiver_alert",
                    "reminder_id": str(reminder.id),
                    "reminderId": str(reminder.id),
                    "isCaregiverAlert": True
                },
                sound="default",
                priority="high"
            )
            logger.info(f"[Scheduler] Escalation sent for reminder {reminder.id}: {result}")

    except Exception as e:
        logger.error(f"[Scheduler] Error in send_caregiver_escalations: {e}")
    finally:
        db.close()


def start_scheduler() -> BackgroundScheduler:
    scheduler = BackgroundScheduler()

    # T+0: initial notification at the scheduled time
    scheduler.add_job(
        send_user_notifications,
        trigger=IntervalTrigger(seconds=60),
        id="send_user_notifications",
        replace_existing=True
    )

    # T+2min: retry if still PENDING
    scheduler.add_job(
        lambda: send_user_retry(2),
        trigger=IntervalTrigger(seconds=60),
        id="send_user_retry_2min",
        replace_existing=True
    )

    # T+5min: retry if still PENDING
    scheduler.add_job(
        lambda: send_user_retry(5),
        trigger=IntervalTrigger(seconds=60),
        id="send_user_retry_5min",
        replace_existing=True
    )

    # T+10min: escalate to caregiver if PENDING or POSTPONED
    scheduler.add_job(
        send_caregiver_escalations,
        trigger=IntervalTrigger(seconds=60),
        id="send_caregiver_escalations",
        replace_existing=True
    )

    scheduler.start()
    logger.info("[Scheduler] Started — checking reminders every 60 seconds")
    return scheduler
