import json
import logging
from datetime import timedelta

from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)


def _is_configured():
    return all(
        (
            settings.CLOUD_TASKS_ENABLED,
            settings.CLOUD_TASKS_PROJECT_ID,
            settings.CLOUD_TASKS_CHAT_REMINDER_URL,
            settings.CLOUD_TASKS_INVOKER_SERVICE_ACCOUNT,
            settings.CLOUD_TASKS_HANDLER_SECRET,
        )
    )


def schedule_unread_message_reminder(message_id):
    """Schedule a best-effort, delayed reminder without delaying message delivery."""
    if not _is_configured():
        return

    try:
        from google.cloud import tasks_v2
        from google.protobuf import timestamp_pb2

        client = tasks_v2.CloudTasksClient()
        parent = client.queue_path(
            settings.CLOUD_TASKS_PROJECT_ID,
            settings.CLOUD_TASKS_LOCATION,
            settings.CLOUD_TASKS_CHAT_REMINDER_QUEUE,
        )
        schedule_time = timestamp_pb2.Timestamp()
        schedule_time.FromDatetime(timezone.now() + timedelta(seconds=settings.CHAT_UNREAD_REMINDER_DELAY_SECONDS))
        task = tasks_v2.Task(
            http_request=tasks_v2.HttpRequest(
                http_method=tasks_v2.HttpMethod.POST,
                url=settings.CLOUD_TASKS_CHAT_REMINDER_URL,
                headers={
                    "Content-Type": "application/json",
                    "X-Collune-Task-Secret": settings.CLOUD_TASKS_HANDLER_SECRET,
                },
                body=json.dumps({"message_id": str(message_id)}).encode("utf-8"),
                oidc_token=tasks_v2.OidcToken(
                    service_account_email=settings.CLOUD_TASKS_INVOKER_SERVICE_ACCOUNT,
                    audience=settings.CLOUD_TASKS_CHAT_REMINDER_URL,
                ),
            ),
            schedule_time=schedule_time,
        )
        client.create_task(parent=parent, task=task)
    except Exception:
        # A reminder must never make sending a chat message fail.
        logger.exception("Unable to schedule unread chat reminder for message=%s", message_id)
