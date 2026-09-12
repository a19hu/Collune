from datetime import timedelta
from html import escape

from celery import shared_task
from django.conf import settings
from django.db import transaction
from django.utils import timezone

from ..common.services import send_brevo_email
from ..models import ChatMessage, UserRole


def _send_unread_chat_reminder(message_id):
    """Send one reminder only when the message is still unread."""
    with transaction.atomic():
        message = ChatMessage.objects.select_for_update().select_related(
            "sender", "conversation__brand__user", "conversation__creator__user",
        ).filter(message_id=message_id).first()
        if not message or message.is_read or message.deleted_at or message.email_reminded_at:
            return False

        recipient = message.conversation.creator.user if message.sender.role == UserRole.BRAND else message.conversation.brand.user
        if not recipient.email:
            return False

        chat_path = "/creator/chat" if recipient.role == UserRole.CREATOR else "/brand/chat"
        chat_url = f"{settings.FRONTEND_URL.rstrip('/')}{chat_path}?conversationId={message.conversation_id}"
        sender_name = message.sender.profile_name
        subject = f"Unread message from {sender_name} on Collune"
        text_content = (
            f"Hi {recipient.profile_name},\n\n"
            f"You have an unread message from {sender_name} on Collune:\n\n"
            f"{message.content}\n\n"
            f"Open the conversation: {chat_url}\n\n"
            "This reminder was sent because the message was still unread."
        )
        send_brevo_email(
            recipient.email,
            subject,
            (
                "<html><body style=\"font-family: Arial, sans-serif;\">"
                f"<h2>New unread message from {escape(sender_name)}</h2>"
                f"<p>Hi {escape(recipient.profile_name)},</p>"
                f"<p>{escape(message.content)}</p>"
                f"<p><a href=\"{escape(chat_url, quote=True)}\">Open the conversation</a></p>"
                "</body></html>"
            ),
            text_content,
        )

        message.email_reminded_at = timezone.now()
        message.save(update_fields=["email_reminded_at"])
        return True


@shared_task(autoretry_for=(Exception,), retry_backoff=True, max_retries=3)
def email_unread_chat_reminder(message_id):
    return _send_unread_chat_reminder(message_id)


@shared_task(autoretry_for=(Exception,), retry_backoff=True, max_retries=3)
def email_unread_chat_reminders():
    """Catch up reminders that were created before a worker was available."""
    cutoff = timezone.now() - timedelta(seconds=settings.CHAT_UNREAD_EMAIL_REMINDER_DELAY_SECONDS)
    message_ids = ChatMessage.objects.filter(
        created_at__lte=cutoff,
        is_read=False,
        deleted_at__isnull=True,
        email_reminded_at__isnull=True,
    ).values_list("message_id", flat=True)
    return sum(_send_unread_chat_reminder(message_id) for message_id in message_ids.iterator())
