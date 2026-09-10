from datetime import timedelta

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone

from ..models import ChatMessage, UserRole


@shared_task(autoretry_for=(Exception,), retry_backoff=True, max_retries=3)
def email_unread_chat_reminders():
    """Email each unread, non-deleted chat message once it has been unread for 30 minutes."""
    cutoff = timezone.now() - timedelta(minutes=30)
    message_ids = ChatMessage.objects.filter(
        created_at__lte=cutoff,
        is_read=False,
        deleted_at__isnull=True,
        email_reminded_at__isnull=True,
    ).values_list("message_id", flat=True)

    sent = 0
    for message_id in message_ids.iterator():
        with transaction.atomic():
            message = ChatMessage.objects.select_for_update().select_related(
                "sender", "conversation__brand__user", "conversation__creator__user",
            ).filter(message_id=message_id).first()
            if not message or message.is_read or message.deleted_at or message.email_reminded_at:
                continue

            recipient = (
                message.conversation.creator.user
                if message.sender.role == UserRole.BRAND
                else message.conversation.brand.user
            )
            chat_path = "/creator/chat" if recipient.role == UserRole.CREATOR else "/brand/chat"
            chat_url = f"{settings.FRONTEND_URL.rstrip('/')}{chat_path}?conversationId={message.conversation_id}"
            sender_name = message.sender.profile_name
            body = (
                f"Hi {recipient.profile_name},\n\n"
                f"You have an unread message from {sender_name} on Collune:\n\n"
                f"{message.content}\n\n"
                f"Open the conversation: {chat_url}\n\n"
                "This reminder was sent because the message was unread for 30 minutes."
            )
            delivered = send_mail(
                subject=f"Unread message from {sender_name} on Collune",
                message=body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient.email],
                fail_silently=False,
            )
            if not delivered:
                raise RuntimeError(f"Chat reminder email was not accepted for {message.message_id}")
            message.email_reminded_at = timezone.now()
            message.save(update_fields=["email_reminded_at"])
            sent += 1
    return sent
