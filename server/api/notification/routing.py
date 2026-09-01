from django.urls import path

from .consumers import NotificationConsumer
from ..chat.consumers import ChatConsumer, ChatInboxConsumer


websocket_urlpatterns = [
    path("ws/notifications/", NotificationConsumer.as_asgi()),
    path("ws/chat/", ChatInboxConsumer.as_asgi()),
    path("ws/chat/<uuid:conversation_id>/", ChatConsumer.as_asgi()),
]
