from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.utils import timezone

from ..models import BrandProfile, ChatConversation, ChatMessage, CreatorProfile, UserRole
from .tasks import email_unread_chat_reminders


@override_settings(DEFAULT_FROM_EMAIL="noreply@example.com", FRONTEND_URL="https://app.collune.test")
class UnreadChatEmailReminderTests(TestCase):
    def setUp(self):
        self.brand_user = get_user_model().objects.create_user(
            username="brand", email="brand@example.com", role=UserRole.BRAND,
        )
        self.creator_user = get_user_model().objects.create_user(
            username="creator", email="creator@example.com", role=UserRole.CREATOR,
        )
        brand = BrandProfile.objects.create(user=self.brand_user, company_name="Brand")
        creator = CreatorProfile.objects.create(user=self.creator_user, display_name="Creator")
        self.conversation = ChatConversation.objects.create(brand=brand, creator=creator)

    @patch("api.chat.tasks.send_mail", return_value=1)
    def test_emails_an_unread_message_once_after_30_minutes(self, send_mail):
        message = ChatMessage.objects.create(
            conversation=self.conversation, sender=self.brand_user, content="Hello creator",
        )
        ChatMessage.objects.filter(pk=message.pk).update(created_at=timezone.now() - timedelta(minutes=30))

        self.assertEqual(email_unread_chat_reminders(), 1)
        message.refresh_from_db()
        self.assertIsNotNone(message.email_reminded_at)
        self.assertEqual(send_mail.call_args.kwargs["recipient_list"], ["creator@example.com"])
        self.assertIn("Hello creator", send_mail.call_args.kwargs["message"])
        self.assertEqual(email_unread_chat_reminders(), 0)

    @patch("api.chat.tasks.send_mail")
    def test_does_not_email_messages_that_were_read(self, send_mail):
        message = ChatMessage.objects.create(
            conversation=self.conversation, sender=self.brand_user, content="Already read", is_read=True,
        )
        ChatMessage.objects.filter(pk=message.pk).update(created_at=timezone.now() - timedelta(minutes=31))

        self.assertEqual(email_unread_chat_reminders(), 0)
        send_mail.assert_not_called()
