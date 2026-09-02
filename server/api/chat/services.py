import logging

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .serializers import ChatMessageSerializer

logger = logging.getLogger(__name__)


def conversation_group_name(conversation_id):
    return f"chat.conversation.{conversation_id}"


def chat_user_group_name(user_id):
    return f"chat.user.{user_id}"


def get_chat_partner_user_ids(user):
    """Return user_ids of everyone `user` has an open chat conversation with."""
    from ..models import ChatConversation, UserRole

    if user.role == UserRole.BRAND:
        conversations = ChatConversation.objects.filter(brand__user=user).select_related("creator")
        return [str(conversation.creator.user_id) for conversation in conversations]
    if user.role == UserRole.CREATOR:
        conversations = ChatConversation.objects.filter(creator__user=user).select_related("brand")
        return [str(conversation.brand.user_id) for conversation in conversations]
    return []


def broadcast_presence_change(user_id, partner_user_ids, is_online, last_seen=None):
    channel_layer = get_channel_layer()
    if not channel_layer:
        return

    payload = {
        "event": "presence.update",
        "user_id": str(user_id),
        "is_online": is_online,
        "last_seen": last_seen,
    }

    for partner_id in set(partner_user_ids):
        try:
            async_to_sync(channel_layer.group_send)(
                chat_user_group_name(partner_id),
                {"type": "chat.message", "payload": payload},
            )
        except Exception:
            logger.exception(
                "Presence broadcast failed for user=%s partner=%s",
                user_id,
                partner_id,
            )


def serialize_chat_message(message):
    payload = ChatMessageSerializer(message).data
    payload["conversation_id"] = str(message.conversation_id)
    return payload


def broadcast_chat_message(message):
    channel_layer = get_channel_layer()
    if not channel_layer:
        return
    try:
        async_to_sync(channel_layer.group_send)(
            conversation_group_name(message.conversation_id),
            {
                "type": "chat.message",
                "payload": {
                    "event": "chat.message",
                    "message": serialize_chat_message(message),
                },
            },
        )
    except Exception:
        logger.exception(
            "Realtime chat delivery failed for conversation=%s message=%s",
            message.conversation_id,
            message.message_id,
        )


def broadcast_chat_inbox_event(conversation, message):
    channel_layer = get_channel_layer()
    if not channel_layer:
        return

    payload = {
        "event": "chat.inbox",
        "conversation_id": str(conversation.conversation_id),
        "message": serialize_chat_message(message),
    }

    user_ids = {
        str(conversation.brand.user.user_id),
        str(conversation.creator.user.user_id),
    }

    for user_id in user_ids:
        try:
            async_to_sync(channel_layer.group_send)(
                chat_user_group_name(user_id),
                {
                    "type": "chat.message",
                    "payload": payload,
                },
            )
        except Exception:
            logger.exception(
                "Realtime chat inbox delivery failed for conversation=%s message=%s user=%s",
                conversation.conversation_id,
                message.message_id,
                user_id,
            )
