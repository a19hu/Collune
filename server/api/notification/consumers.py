from urllib.parse import parse_qs

from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from rest_framework_simplejwt.tokens import AccessToken

from .services import notification_group_name

User = get_user_model()


class NotificationConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user = await self.resolve_user()
        if not self.user:
            await self.close(code=4401)
            return

        self.group_name = notification_group_name(self.user.user_id)
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        unread_count = await sync_to_async(self.user.notifications.filter(is_read=False).count)()
        await self.send_json(
            {
                "event": "notifications.connected",
                "user_id": str(self.user.user_id),
                "unread_count": unread_count,
            }
        )

    async def disconnect(self, close_code):
        if getattr(self, "group_name", None):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        if content.get("event") == "ping":
            await self.send_json({"event": "pong"})

    async def notification_message(self, event):
        await self.send_json(event["payload"])

    async def resolve_user(self):
        query_string = self.scope.get("query_string", b"").decode()
        params = parse_qs(query_string)
        raw_token = (params.get("token") or params.get("access_token") or [""])[0]
        if not raw_token:
            return None

        user = await self.get_user_from_drf_token(raw_token)
        if user:
            return user
        return await self.get_user_from_jwt(raw_token)

    @sync_to_async
    def get_user_from_drf_token(self, raw_token):
        token = Token.objects.select_related("user").filter(key=raw_token).first()
        return token.user if token and token.user.is_active else None

    @sync_to_async
    def get_user_from_jwt(self, raw_token):
        try:
            validated = AccessToken(raw_token)
            user_id = validated.get("user_id")
        except Exception:
            return None
        return User.objects.filter(user_id=user_id, is_active=True).first()
