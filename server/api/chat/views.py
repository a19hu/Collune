from django.db.models import Prefetch
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import ChatConversation, ChatMessage, UserRole
from ..notification import create_notification
from ..permissions import IsBrand, IsCreator
from .serializers import ChatConversationCreateSerializer, ChatConversationSerializer, ChatMessageSerializer
from .services import broadcast_chat_inbox_event, broadcast_chat_message


class ChatAccessMixin:
    permission_classes = [IsAuthenticated]

    def get_queryset(self, request):
        queryset = ChatConversation.objects.select_related(
            "brand",
            "brand__user",
            "creator",
            "creator__user",
        ).prefetch_related(
            Prefetch("messages", queryset=ChatMessage.objects.select_related("sender").order_by("-created_at"))
        )
        if request.user.role == UserRole.BRAND:
            return queryset.filter(brand__user=request.user)
        if request.user.role == UserRole.CREATOR:
            return queryset.filter(creator__user=request.user)
        return queryset.none()

    def get_conversation(self, request, conversation_id):
        return get_object_or_404(self.get_queryset(request), conversation_id=conversation_id)


class ChatConversationListCreateView(ChatAccessMixin, APIView):
    def get(self, request):
        conversations = self.get_queryset(request).order_by("-updated_at")
        for conversation in conversations:
            conversation.latest_message_obj = next(iter(conversation.messages.all()), None)
        serializer = ChatConversationSerializer(conversations, many=True, context={"request": request})
        return Response({"conversations": serializer.data})

    def post(self, request):
        serializer = ChatConversationCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        if request.user.role == UserRole.BRAND:
            brand = request.user.brand_profile
            creator = serializer.validated_data["creator"]
        else:
            brand = serializer.validated_data["brand"]
            creator = request.user.creator_profile

        conversation, created = ChatConversation.objects.get_or_create(brand=brand, creator=creator)
        response_serializer = ChatConversationSerializer(conversation, context={"request": request})
        return Response({"conversation": response_serializer.data, "created": created}, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class ChatMessageListCreateView(ChatAccessMixin, APIView):
    def get(self, request, conversation_id):
        conversation = self.get_conversation(request, conversation_id)
        messages = conversation.messages.select_related("sender").order_by("created_at")
        unread_queryset = messages.exclude(sender=request.user).filter(is_read=False)
        unread_queryset.update(is_read=True, read_at=timezone.now())
        serializer = ChatMessageSerializer(messages, many=True)
        return Response({"conversation_id": str(conversation.conversation_id), "messages": serializer.data})

    def post(self, request, conversation_id):
        conversation = self.get_conversation(request, conversation_id)
        content = str(request.data.get("content", "")).strip()
        if not content:
            return Response({"content": ["This field is required."]}, status=status.HTTP_400_BAD_REQUEST)

        message = ChatMessage.objects.create(
            conversation=conversation,
            sender=request.user,
            content=content,
        )
        conversation.updated_at = timezone.now()
        conversation.save(update_fields=["updated_at"])

        recipient = conversation.creator.user if request.user.role == UserRole.BRAND else conversation.brand.user
        create_notification(
            recipient=recipient,
            actor=request.user,
            event_type="chat.message.received",
            title="New chat message",
            message=f"{request.user.profile_name} sent you a message.",
            data={"conversation_id": str(conversation.conversation_id), "message_id": str(message.message_id)},
        )
        broadcast_chat_message(message)
        broadcast_chat_inbox_event(conversation, message)
        serializer = ChatMessageSerializer(message)
        return Response({"message": serializer.data}, status=status.HTTP_201_CREATED)


class ChatConversationReadView(ChatAccessMixin, APIView):
    def patch(self, request, conversation_id):
        conversation = self.get_conversation(request, conversation_id)
        updated = conversation.messages.exclude(sender=request.user).filter(is_read=False).update(is_read=True, read_at=timezone.now())
        return Response({"updated": updated})
