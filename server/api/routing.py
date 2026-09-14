from django.urls import path

from .chat.consumers import ChatConsumer, ChatInboxConsumer
from .notification.consumers import NotificationConsumer


websocket_urlpatterns = [
    path("ws/chat/<uuid:conversation_id>/", ChatConsumer.as_asgi()),
    path("ws/chat/", ChatInboxConsumer.as_asgi()),
    path("ws/notifications/", NotificationConsumer.as_asgi()),
]