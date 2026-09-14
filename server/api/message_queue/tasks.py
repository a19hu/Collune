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
        chat_url = f"https://collune.com{chat_path}?conversationId={message.conversation_id}"
        sender_name = message.sender.name
        subject = f"Unread message from {sender_name} on Collune"
        recipient_name = escape(recipient.profile_name or "there")
        safe_sender_name = escape(sender_name)
        safe_message_content = escape(message.content).replace("\n", "<br>")
        safe_chat_url = escape(chat_url, quote=True)
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
            f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{escape(subject)}</title>
  </head>
  <body style="margin:0; padding:0; background:#f4f7fb; color:#172033; font-family:Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4f7fb;">
      <tr>
        <td align="center" style="padding:36px 16px;">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%; max-width:600px; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 18px rgba(20,56,168,0.08);">
            <tr>
              <td style="padding:26px 40px; background:#1438a8;">
                <a href="https://collune.com" style="color:#ffffff; text-decoration:none; display:inline-block; font-size:24px; font-weight:700; letter-spacing:-0.5px;">
                  <img src="https://collune.com/favicon.svg" width="28" height="28" alt="" style="display:inline-block; vertical-align:middle; margin-right:9px; border:0;" />
                  <span style="vertical-align:middle;">Collune</span>
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:40px 40px 20px;">
                <div style="display:inline-block; padding:6px 10px; border-radius:999px; background:#eef2ff; color:#1438a8; font-size:12px; font-weight:700; letter-spacing:0.5px; text-transform:uppercase;">New message</div>
                <h1 style="margin:18px 0 12px; color:#172033; font-size:27px; line-height:34px; font-weight:700; letter-spacing:-0.4px;">You have an unread message</h1>
                <p style="margin:0; color:#526176; font-size:16px; line-height:25px;">Hi {recipient_name},</p>
                <p style="margin:16px 0 0; color:#526176; font-size:16px; line-height:25px;">{safe_sender_name} sent you a message on Collune.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:4px 40px 28px;">
                <div style="padding:20px; border-left:4px solid #b8a8ff; border-radius:4px 10px 10px 4px; background:#f7f8ff; color:#344054; font-size:15px; line-height:24px;">{safe_message_content}</div>
              </td>
            </tr>
            <tr>
              <td align="left" style="padding:0 40px 40px;">
                <a href="{safe_chat_url}" style="display:inline-block; padding:14px 22px; border-radius:8px; background:#1438a8; color:#ffffff; font-size:15px; font-weight:700; line-height:20px; text-decoration:none;">Open conversation</a>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px; border-top:1px solid #e8ecf3; background:#fbfcfe; color:#7a8699; font-size:12px; line-height:18px;">
                This reminder was sent because the message is still unread. If the button does not work, copy and paste this link into your browser:<br>
                <a href="{safe_chat_url}" style="color:#1438a8; text-decoration:underline; word-break:break-all;">{safe_chat_url}</a>
              </td>
            </tr>
          </table>
          <p style="margin:20px 0 0; color:#98a2b3; font-size:12px; line-height:18px;">© Collune. Connecting brands and creators.</p>
        </td>
      </tr>
    </table>
  </body>
</html>""",
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
