from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.urls import reverse

from api.models import BrandProfile, ChatConversation, ChatMessage, CreatorProfile, UserRole
from api.chat_reminders.services import schedule_unread_message_reminder
from api.common.services import send_aisensy_chat_reminder


@override_settings(
    CLOUD_TASKS_HANDLER_SECRET="test-task-secret",
    FRONTEND_URL="https://collune.com",
    AISENSY_CHAT_REMINDER_CAMPAIGN_NAME="",
)
class UnreadChatReminderTaskTests(TestCase):
    def setUp(self):
        user_model = get_user_model()
        self.brand_user = user_model.objects.create_user(
            username="reminder-brand",
            email="brand@example.test",
            name="Brand User",
            role=UserRole.BRAND,
        )
        self.creator_user = user_model.objects.create_user(
            username="reminder-creator",
            email="creator@example.test",
            name="Creator User",
            phone_no="+919876543210",
            role=UserRole.CREATOR,
        )
        brand = BrandProfile.objects.create(user=self.brand_user, company_name="Reminder Brand")
        creator = CreatorProfile.objects.create(user=self.creator_user, display_name="Reminder Creator")
        self.conversation = ChatConversation.objects.create(brand=brand, creator=creator)
        self.message = ChatMessage.objects.create(
            conversation=self.conversation,
            sender=self.brand_user,
            content="Private message content must not be included in the reminder.",
        )
        self.url = reverse("chat_unread_reminder_task")

    @patch("api.chat_reminders.views.send_brevo_email")
    def test_sends_email_only_when_message_is_unread(self, send_email):
        response = self.client.post(
            self.url,
            {"message_id": str(self.message.message_id)},
            content_type="application/json",
            HTTP_X_COLLUNE_TASK_SECRET="test-task-secret",
        )

        self.assertEqual(response.status_code, 204)
        send_email.assert_called_once()
        self.message.refresh_from_db()
        self.assertIsNotNone(self.message.reminder_email_sent_at)
        self.assertIsNone(self.message.reminder_whatsapp_sent_at)
        _, subject, html_content, text_content = send_email.call_args.args
        self.assertEqual(subject, "Unread message from Brand User on Collune")
        self.assertIn("You have an unread message", html_content)
        self.assertIn("Open conversation", html_content)
        self.assertIn("conversationId=", html_content)
        self.assertIn("Open:", text_content)
        self.assertNotIn(self.message.content, html_content)

    @patch("api.chat_reminders.views.send_brevo_email")
    def test_does_not_send_for_a_read_message(self, send_email):
        self.message.is_read = True
        self.message.save(update_fields=["is_read"])

        response = self.client.post(
            self.url,
            {"message_id": str(self.message.message_id)},
            content_type="application/json",
            HTTP_X_COLLUNE_TASK_SECRET="test-task-secret",
        )

        self.assertEqual(response.status_code, 204)
        send_email.assert_not_called()

    def test_rejects_a_request_without_the_task_secret(self):
        response = self.client.post(self.url, {"message_id": str(self.message.message_id)}, content_type="application/json")
        self.assertEqual(response.status_code, 403)


@override_settings(
    CLOUD_TASKS_ENABLED=True,
    CLOUD_TASKS_PROJECT_ID="collune-test",
    CLOUD_TASKS_LOCATION="asia-south1",
    CLOUD_TASKS_CHAT_REMINDER_QUEUE="chat-reminders",
    CLOUD_TASKS_CHAT_REMINDER_URL="https://backend.example/tasks/chat/unread-reminder/",
    CLOUD_TASKS_INVOKER_SERVICE_ACCOUNT="chat-reminder-tasks@collune-test.iam.gserviceaccount.com",
    CLOUD_TASKS_HANDLER_SECRET="test-task-secret",
    CHAT_UNREAD_REMINDER_DELAY_SECONDS=1800,
)
class ChatReminderSchedulingTests(TestCase):
    @patch("google.cloud.tasks_v2.CloudTasksClient")
    def test_schedules_an_authenticated_task_for_thirty_minutes_later(self, client_class):
        client_class.return_value.queue_path.return_value = "projects/collune-test/locations/asia-south1/queues/chat-reminders"
        schedule_unread_message_reminder("a0f4cbde-4051-4882-bc72-9f296ec3d3b0")

        client_class.return_value.create_task.assert_called_once()
        kwargs = client_class.return_value.create_task.call_args.kwargs
        task = kwargs["task"]
        self.assertEqual(kwargs["parent"], "projects/collune-test/locations/asia-south1/queues/chat-reminders")
        self.assertEqual(task.http_request.url, "https://backend.example/tasks/chat/unread-reminder/")
        self.assertEqual(task.http_request.oidc_token.service_account_email, "chat-reminder-tasks@collune-test.iam.gserviceaccount.com")
        self.assertEqual(task.http_request.headers["X-Collune-Task-Secret"], "test-task-secret")
        self.assertEqual(task.http_request.body, b'{"message_id": "a0f4cbde-4051-4882-bc72-9f296ec3d3b0"}')


@override_settings(AISENSY_CHAT_REMINDER_CAMPAIGN_NAME="collune_unread_message_reminder")
class AiSensyChatReminderTests(TestCase):
    @patch("api.common.services.requests.post")
    def test_payload_matches_the_two_parameter_static_cta_template(self, post):
        with patch(
            "api.common.services.get_env",
            side_effect=lambda name, fallback=None: "test-api-key" if name == "AISENSY_API_KEY" else fallback,
        ):
            send_aisensy_chat_reminder(
                "+919876543210",
                "Aman",
                "Brand User",
                "creator/chat?conversationId=example-id",
            )

        payload = post.call_args.kwargs["json"]
        self.assertEqual(payload["campaignName"], "collune_unread_message_reminder")
        self.assertEqual(payload["templateParams"], ["Aman", "Brand User"])
        self.assertEqual(payload["buttons"][0]["parameters"][0]["text"], "creator/chat?conversationId=example-id")
