"""Notification Service module.

This module provides functionality for sending push notifications via Expo.
"""

from exponent_server_sdk import (
    DeviceNotRegisteredError,
    PushClient,
    PushMessage,
    PushServerError,
    PushTicketError,
)
from typing import List, Dict
import logging

logger = logging.getLogger(__name__)


class NotificationService:
    """Service for sending push notifications through Expo."""

    def __init__(self):
        """Initialize the notification service with Expo Push Client."""
        self.push_client = PushClient()

    def send_notification(
        self,
        tokens: List[str],
        title: str,
        body: str,
        data: Dict = None,
        sound: str = "default",
        badge: int = None,
        priority: str = "default"
    ) -> Dict:
        """Send a push notification to one or more devices.
        
        Args:
            tokens (List[str]): List of Expo push tokens
            title (str): Notification title
            body (str): Notification body/message
            data (Dict): Optional extra data to send with notification
            sound (str): Sound to play ("default" or custom sound name)
            badge (int): Badge number to display on app icon
            priority (str): Priority level ("default", "normal", or "high")
            
        Returns:
            Dict: Results containing successful and failed sends
            
        Example:
            >>> service = NotificationService()
            >>> result = service.send_notification(
            ...     tokens=["ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"],
            ...     title="Nouveau rappel",
            ...     body="Il est temps de prendre vos médicaments"
            ... )
        """
        if not tokens:
            return {"success": [], "errors": []}

        # Filter out invalid tokens
        valid_tokens = [token for token in tokens if PushClient.is_exponent_push_token(token)]
        
        if not valid_tokens:
            logger.warning("No valid Expo push tokens provided")
            return {"success": [], "errors": ["No valid tokens"]}

        # Create push messages
        messages = []
        for token in valid_tokens:
            message = PushMessage(
                to=token,
                title=title,
                body=body,
                data=data or {},
                sound=sound,
                badge=badge,
                priority=priority
            )
            messages.append(message)

        # Send notifications
        successes = []
        errors = []

        try:
            # Send messages in chunks (Expo recommends max 100 per request)
            chunk_size = 100
            for i in range(0, len(messages), chunk_size):
                chunk = messages[i:i + chunk_size]
                
                try:
                    # Get push tickets
                    tickets = self.push_client.publish_multiple(chunk)
                    
                    # Process tickets
                    for idx, ticket in enumerate(tickets):
                        token = valid_tokens[i + idx]
                        
                        if ticket.is_success():
                            successes.append({
                                "token": token,
                                "ticket_id": ticket.id
                            })
                        else:
                            errors.append({
                                "token": token,
                                "error": ticket.message
                            })
                            logger.error(f"Push notification failed for {token}: {ticket.message}")
                            
                except PushServerError as e:
                    logger.error(f"Expo push server error: {e}")
                    errors.append({"error": f"Server error: {str(e)}"})
                    
        except Exception as e:
            logger.error(f"Unexpected error sending push notifications: {e}")
            errors.append({"error": f"Unexpected error: {str(e)}"})

        return {
            "success": successes,
            "errors": errors,
            "total_sent": len(successes),
            "total_failed": len(errors)
        }

    def send_reminder_notification(
        self,
        tokens: List[str],
        reminder_title: str,
        reminder_description: str = None,
        reminder_id: str = None
    ) -> Dict:
        """Send a reminder notification.
        
        Args:
            tokens (List[str]): List of Expo push tokens
            reminder_title (str): The reminder title
            reminder_description (str): Optional reminder description
            reminder_id (str): Optional reminder ID for deep linking
            
        Returns:
            Dict: Results of the notification send
        """
        body = reminder_description or "Vous avez un rappel"
        data = {
            "type": "reminder",
            "reminder_id": reminder_id
        } if reminder_id else {"type": "reminder"}

        return self.send_notification(
            tokens=tokens,
            title=reminder_title,
            body=body,
            data=data,
            sound="default",
            priority="high"
        )