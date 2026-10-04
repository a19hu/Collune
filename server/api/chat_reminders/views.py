import json
import logging
from html import escape

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from django.utils.crypto import constant_time_compare
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from ..common.services import send_aisensy_chat_reminder, send_brevo_email
from ..models import ChatMessage, UserRole

logger = logging.getLogger(__name__)


class UnreadChatReminderTaskView(APIView):
    """Cloud Tasks target. It is protected by Cloud Run OIDC and an app secret."""

    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        expected_secret = settings.CLOUD_TASKS_HANDLER_SECRET
        supplied_secret = request.headers.get("X-Collune-Task-Secret", "")
        if not expected_secret or not constant_time_compare(supplied_secret, expected_secret):
            return Response(status=status.HTTP_403_FORBIDDEN)

        message_id = request.data.get("message_id")
        if not message_id:
            return Response({"message_id": ["This field is required."]}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            message = (
                ChatMessage.objects.select_for_update()
                .select_related("sender", "conversation__brand__user", "conversation__creator__user")
                .filter(message_id=message_id)
                .first()
            )
            if not message or message.is_read or message.deleted_at:
                return Response(status=status.HTTP_204_NO_CONTENT)

            recipient = (
                message.conversation.creator.user
                if message.sender.role == UserRole.BRAND
                else message.conversation.brand.user
            )
            self._send_missing_reminders(message, recipient)

        return Response(status=status.HTTP_204_NO_CONTENT)

    def _send_missing_reminders(self, message, recipient):
        sender_name = message.sender.profile_name or "Someone"
        recipient_name = recipient.profile_name or "there"
        role_path = "creator" if recipient.role == UserRole.CREATOR else "brand"
        chat_path = f"{role_path}/chat?conversationId={message.conversation_id}"
        chat_url = f"{settings.FRONTEND_URL.rstrip('/')}/{chat_path}"

        if not message.reminder_email_sent_at and recipient.email:
            safe_sender = escape(sender_name)
            safe_recipient = escape(recipient_name)
            safe_url = escape(chat_url, quote=True)
            html_content = f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>You have an unread message on Collune</title>
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
              <td style="padding:40px 40px 16px;">
                <div style="display:inline-block; padding:6px 10px; border-radius:999px; background:#eef2ff; color:#1438a8; font-size:12px; font-weight:700; letter-spacing:0.5px; text-transform:uppercase;">New message</div>
                <h1 style="margin:18px 0 12px; color:#172033; font-size:27px; line-height:34px; font-weight:700; letter-spacing:-0.4px;">You have an unread message</h1>
                <p style="margin:0; color:#526176; font-size:16px; line-height:25px;">Hi {safe_recipient}, {safe_sender} sent you a message on Collune. Open the conversation to reply.</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:24px 40px 40px;">
                <a href="{safe_url}" style="display:inline-block; padding:14px 24px; border-radius:8px; background:#1438a8; color:#ffffff; font-size:16px; font-weight:700; text-decoration:none;">Open conversation</a>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px; border-top:1px solid #e8ecf3; background:#fbfcfe; color:#7a8699; font-size:12px; line-height:18px;">You are receiving this because you have an unread Collune chat message. The message content is not included here for your privacy.</td>
            </tr>
          </table>
          <p style="margin:20px 0 0; color:#98a2b3; font-size:12px; line-height:18px;">© Collune. Connecting brands and creators.</p>
        </td>
      </tr>
    </table>
  </body>
</html>"""
            send_brevo_email(
                recipient.email,
                f"Unread message from {sender_name} on Collune",
                html_content,
                f"Hi {recipient_name}, you have an unread message from {sender_name}. Open: {chat_url}",
            )
            message.reminder_email_sent_at = timezone.now()

        # WhatsApp requires a pre-approved AiSensy template. If the campaign
        # is not configured, email remains available and no retry is needed.
        if (
            not message.reminder_whatsapp_sent_at
            and recipient.phone_no
            and settings.AISENSY_CHAT_REMINDER_CAMPAIGN_NAME
        ):
            send_aisensy_chat_reminder(recipient.phone_no, recipient_name, sender_name, chat_path)
            message.reminder_whatsapp_sent_at = timezone.now()

        message.save(update_fields=["reminder_email_sent_at", "reminder_whatsapp_sent_at"])
