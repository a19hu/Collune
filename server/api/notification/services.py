from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.contrib.auth import get_user_model

from ..models import Notification, UserRole
from .serializers import NotificationSerializer

User = get_user_model()


def notification_group_name(user_id):
    return f"notifications.user.{user_id}"


def serialize_notification(notification):
    return NotificationSerializer(notification).data


def push_notification(notification):
    channel_layer = get_channel_layer()
    if not channel_layer:
        return
    payload = {
        "event": "notification.created",
        "notification": serialize_notification(notification),
    }
    async_to_sync(channel_layer.group_send)(
        notification_group_name(notification.recipient_id),
        {"type": "notification.message", "payload": payload},
    )
    push_unread_count(notification.recipient)


def push_unread_count(user):
    channel_layer = get_channel_layer()
    if not channel_layer:
        return
    unread_count = user.notifications.filter(is_read=False).count()
    async_to_sync(channel_layer.group_send)(
        notification_group_name(user.user_id),
        {
            "type": "notification.message",
            "payload": {
                "event": "notification.unread_count",
                "unread_count": unread_count,
            },
        },
    )


def create_notification(recipient, event_type, title, message, actor=None, data=None):
    notification = Notification.objects.create(
        recipient=recipient,
        actor=actor,
        event_type=event_type,
        title=title,
        message=message,
        data=data or {},
    )
    push_notification(notification)
    return notification


def create_notifications(recipients, event_type, title, message, actor=None, data=None):
    notifications = []
    seen_ids = set()
    for recipient in recipients:
        if not recipient or recipient.user_id in seen_ids:
            continue
        seen_ids.add(recipient.user_id)
        notifications.append(
            create_notification(
                recipient=recipient,
                event_type=event_type,
                title=title,
                message=message,
                actor=actor,
                data=data,
            )
        )
    return notifications


def notify_admins(event_type, title, message, actor=None, data=None):
    admins = User.objects.filter(role=UserRole.ADMIN, is_active=True).order_by("created_at")
    return create_notifications(admins, event_type, title, message, actor=actor, data=data)
