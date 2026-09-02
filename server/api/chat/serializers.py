from rest_framework import serializers

from ..common.presence import get_last_seen, is_online
from ..models import BrandProfile, ChatConversation, ChatMessage, CreatorProfile


class ChatParticipantSerializer(serializers.Serializer):
    id = serializers.CharField()
    user_id = serializers.CharField()
    role = serializers.CharField()
    name = serializers.CharField()
    subtitle = serializers.CharField(allow_blank=True)
    avatar = serializers.CharField(allow_blank=True, allow_null=True)
    is_online = serializers.BooleanField()
    last_seen = serializers.CharField(allow_blank=True, allow_null=True)


class ChatMessageSerializer(serializers.ModelSerializer):
    sender = serializers.SerializerMethodField()

    class Meta:
        model = ChatMessage
        fields = [
            "message_id",
            "conversation_id",
            "content",
            "sender",
            "is_read",
            "read_at",
            "created_at",
        ]

    def get_sender(self, obj):
        user = obj.sender
        return {
            "user_id": str(user.user_id),
            "role": user.role,
            "name": user.profile_name,
            "email": user.email,
        }


class ChatConversationSerializer(serializers.ModelSerializer):
    other_participant = serializers.SerializerMethodField()
    latest_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = ChatConversation
        fields = [
            "conversation_id",
            "brand_id",
            "creator_id",
            "created_at",
            "updated_at",
            "other_participant",
            "latest_message",
            "unread_count",
        ]

    def _build_brand_participant(self, brand):
        return {
            "id": str(brand.brand_id),
            "user_id": str(brand.user_id),
            "role": "BRAND",
            "name": brand.company_name,
            "subtitle": brand.industry or "Brand",
            "avatar": brand.logo.url if brand.logo else "",
        }

    def _build_creator_participant(self, creator):
        return {
            "id": str(creator.creator_id),
            "user_id": str(creator.user_id),
            "role": "CREATOR",
            "name": creator.display_name,
            "subtitle": creator.category or "Creator",
            "avatar": creator.profile_image.url if creator.profile_image else "",
        }

    def get_other_participant(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user:
            return None
        if user.role == "BRAND":
            participant = self._build_creator_participant(obj.creator)
        else:
            participant = self._build_brand_participant(obj.brand)
        if request and participant.get("avatar"):
            participant["avatar"] = request.build_absolute_uri(participant["avatar"])
        participant["is_online"] = is_online(participant["user_id"])
        participant["last_seen"] = get_last_seen(participant["user_id"])
        return participant

    def get_latest_message(self, obj):
        latest_message = getattr(obj, "latest_message_obj", None)
        if latest_message is None:
            latest_message = obj.messages.select_related("sender").order_by("-created_at").first()
        return ChatMessageSerializer(latest_message).data if latest_message else None

    def get_unread_count(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user:
            return 0
        return obj.messages.exclude(sender=user).filter(is_read=False).count()


class ChatConversationCreateSerializer(serializers.Serializer):
    creator_id = serializers.UUIDField(required=False)
    brand_id = serializers.UUIDField(required=False)

    def validate(self, attrs):
        request = self.context["request"]
        if request.user.role == "BRAND":
            creator_id = attrs.get("creator_id")
            if not creator_id:
                raise serializers.ValidationError({"creator_id": ["This field is required."]})
            try:
                attrs["creator"] = CreatorProfile.objects.select_related("user").get(creator_id=creator_id)
            except CreatorProfile.DoesNotExist:
                raise serializers.ValidationError({"creator_id": ["Creator not found."]})
        elif request.user.role == "CREATOR":
            brand_id = attrs.get("brand_id")
            if not brand_id:
                raise serializers.ValidationError({"brand_id": ["This field is required."]})
            try:
                attrs["brand"] = BrandProfile.objects.select_related("user").get(brand_id=brand_id)
            except BrandProfile.DoesNotExist:
                raise serializers.ValidationError({"brand_id": ["Brand not found."]})
        else:
            raise serializers.ValidationError("Only brands and creators can start chats.")
        return attrs
