from rest_framework import serializers

from ..models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    actor = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            "notification_id",
            "event_type",
            "title",
            "message",
            "data",
            "is_read",
            "read_at",
            "created_at",
            "actor",
        ]

    def get_actor(self, obj):
        if not obj.actor:
            return None
        return {
            "user_id": str(obj.actor.user_id),
            "name": obj.actor.profile_name,
            "email": obj.actor.email,
            "role": obj.actor.role,
        }
