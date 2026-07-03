from rest_framework import serializers

from ..models import (
    CreatorProfile,
    CreatorSocialAccount,
    OtpChannel,
    OtpVerification,
    SocialPlatform,
)
from ..common.serializers import AuthUserSerializer, RegisterUserSerializer


class CreatorSocialAccountInputSerializer(serializers.Serializer):
    platform = serializers.ChoiceField(choices=SocialPlatform.choices)
    handle = serializers.CharField(max_length=120)
    url = serializers.URLField(required=False, allow_blank=True)
    followers = serializers.IntegerField(min_value=0, required=False)
    is_connected = serializers.BooleanField(required=False)

class CreatorRegisterSerializer(serializers.Serializer):
    user = RegisterUserSerializer()
    display_name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    category = serializers.CharField(max_length=120, required=False, allow_blank=True)
    location = serializers.CharField(max_length=160, required=False, allow_blank=True)
    languages = serializers.ListField(child=serializers.CharField(max_length=80), required=False)
    collaboration_preferences = serializers.ListField(child=serializers.CharField(max_length=120), required=False)
    social_accounts = CreatorSocialAccountInputSerializer(many=True, required=False)
    bio = serializers.CharField(required=False, allow_blank=True)
    profile_image = serializers.ImageField(required=False, allow_null=True)

    def validate(self, attrs):
        attrs = super().validate(attrs)
        user_data = attrs.get("user", {})
        email = (user_data.get("email") or "").strip().lower()
        phone = (user_data.get("phone_no") or "").strip().replace(" ", "")

        missing = {}
        if email and not OtpVerification.objects.filter(
            channel=OtpChannel.EMAIL,
            target=email,
            purpose="creator_registration",
            is_verified=True,
        ).exists():
            missing["email"] = "Email OTP is not verified."
        # if phone and not OtpVerification.objects.filter(
        #     channel=OtpChannel.PHONE,
        #     target=phone,
        #     purpose="creator_registration",
        #     is_verified=True,
        # ).exists():
        #     missing["phone_no"] = "Phone OTP is not verified."
        if missing:
            raise serializers.ValidationError({"otp": missing})
        return attrs

class CreatorSocialAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = CreatorSocialAccount
        fields = [
            "account_id",
            "creator",
            "platform",
            "social_id",
            "username",
            "handle",
            "url",
            "followers",
            "media_count",
            "view_count",
            "engagement_rate",
            "audience_country",
            "youtube_short_video_count",
            "youtube_long_video_count",
            "youtube_videos",
            "youtube_analytics",
            "provider_data",
            "expires_at",
            "is_connected",
            "last_synced_at",
            "created_at",
        ]
        read_only_fields = [
            "account_id",
            "creator",
            "social_id",
            "username",
            "followers",
            "media_count",
            "view_count",
            "engagement_rate",
            "audience_country",
            "youtube_short_video_count",
            "youtube_long_video_count",
            "youtube_videos",
            "youtube_analytics",
            "provider_data",
            "expires_at",
            "last_synced_at",
            "created_at",
        ]

class CreatorProfileSerializer(serializers.ModelSerializer):
    user = AuthUserSerializer(read_only=True)
    social_accounts = CreatorSocialAccountSerializer(many=True, read_only=True)
    profile_image_url = serializers.SerializerMethodField()

    class Meta:
        model = CreatorProfile
        fields = [
            "creator_id",
            "user",
            "display_name",
            "category",
            "location",
            "languages",
            "collaboration_preferences",
            "bio",
            "profile_image",
            "profile_image_url",
            "is_profile_visible",
            "verification_status",
            "profile_completion",
            "social_accounts",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["creator_id", "user", "created_at", "updated_at"]

    def get_profile_image_url(self, obj):
        request = self.context.get("request")
        if not obj.profile_image:
            return ""
        return request.build_absolute_uri(obj.profile_image.url) if request else obj.profile_image.url

class CreatorsProfileListSerializer(serializers.ModelSerializer):
    user = AuthUserSerializer(read_only=True)
    social_accounts = CreatorSocialAccountSerializer(many=True, read_only=True)
    profile_image_url = serializers.SerializerMethodField()

    class Meta:
        model = CreatorProfile
        fields = [
            "creator_id",
            "user",
            "display_name",
            "category",
            "location",
            "languages",
            "collaboration_preferences",
            "bio",
            "profile_image",
            "profile_image_url",
            "is_profile_visible",
            "verification_status",
            "profile_completion",
            "social_accounts",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["creator_id", "user", "created_at", "updated_at"]

    def get_profile_image_url(self, obj):
        request = self.context.get("request")
        if not obj.profile_image:
            return ""
        return request.build_absolute_uri(obj.profile_image.url) if request else obj.profile_image.url
