from exponent_server_sdk import PushClient, PushMessage, PushServerError
from typing import List, Dict
import logging

logger = logging.getLogger(__name__)


class NotificationService:

    def __init__(self):
        self.push_client = PushClient()

    def send_notification(
        self,
        tokens: List[str],
        title: str,
        body: str,
        data: Dict = None,
        sound: str = "default",
        priority: str = "high"
    ) -> Dict:
        if not tokens:
            return {"success": 0, "errors": []}

        messages = []
        for token in tokens:
            messages.append(PushMessage(to=token, title=title, body=body, data=data or {}, sound=sound, priority=priority))

        try:
            tickets = self.push_client.publish_multiple(messages)
            errors = []
            success = 0
            for ticket in tickets:
                if ticket.is_success():
                    success += 1
                else:
                    logger.error(f"Push failed: {ticket.message}")
                    errors.append(ticket.message)
            return {"success": success, "errors": errors}
        except PushServerError as e:
            logger.error(f"Expo server error: {e}")
            return {"success": 0, "errors": [str(e)]}
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            return {"success": 0, "errors": [str(e)]}

    def send_reminder_notification(
        self,
        tokens: List[str],
        reminder_title: str,
        reminder_description: str = None,
        reminder_id: str = None,
        extra_data: Dict = None
    ) -> Dict:
        body = reminder_description or "Vous avez un rappel"
        data = {"type": "reminder", "reminderId": reminder_id}
        if extra_data:
            data.update(extra_data)

        return self.send_notification(tokens=tokens, title=reminder_title, body=body, data=data)
