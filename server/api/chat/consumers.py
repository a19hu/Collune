from urllib.parse import parse_qs

from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from rest_framework_simplejwt.tokens import AccessToken

from ..models import ChatConversation
from .services import chat_user_group_name, conversation_group_name

User = get_user_model()


class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user = await self.resolve_user()
        if not self.user:
            await self.close(code=4401)
            return

        conversation_id = self.scope.get("url_route", {}).get("kwargs", {}).get("conversation_id")
        self.conversation = await self.get_conversation(conversation_id)
        if not self.conversation:
            await self.close(code=4404)
            return

        has_access = await self.user_has_access()
        if not has_access:
            await self.close(code=4403)
            return

        self.group_name = conversation_group_name(conversation_id)
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        await self.send_json({"event": "chat.connected", "conversation_id": str(conversation_id)})

    async def disconnect(self, close_code):
        if getattr(self, "group_name", None):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def chat_message(self, event):
        await self.send_json(event["payload"])

    @sync_to_async
    def get_conversation(self, conversation_id):
        return ChatConversation.objects.select_related("brand__user", "creator__user").filter(conversation_id=conversation_id).first()

    @sync_to_async
    def user_has_access(self):
        if self.user.role == "BRAND":
            return self.conversation.brand.user_id == self.user.user_id
        if self.user.role == "CREATOR":
            return self.conversation.creator.user_id == self.user.user_id
        return False

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


class ChatInboxConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user = await ChatConsumer.resolve_user(self)
        if not self.user:
            await self.close(code=4401)
            return

        self.group_name = chat_user_group_name(self.user.user_id)
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        await self.send_json({"event": "chat.inbox.connected", "user_id": str(self.user.user_id)})

    async def disconnect(self, close_code):
        if getattr(self, "group_name", None):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def chat_message(self, event):
        await self.send_json(event["payload"])
