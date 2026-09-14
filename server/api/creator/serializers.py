from rest_framework import serializers
from ..common.services import otp_target_variants

from ..models import (
    CreatorProfile,
    CreatorPortfolio,
    CreatorSocialMediaPricing,
    CreatorSocialAccount,
    OtpChannel,
    OtpVerification,
    SocialPlatform,
)
from ..common.serializers import AuthUserSerializer, RegisterUserSerializer


class CreatorSocialAccountInputSerializer(serializers.Serializer):
    platform = serializers.ChoiceField(choices=SocialPlatform.choices)
    handle = serializers.CharField(max_length=120, required=False, allow_blank=True)
    url = serializers.URLField(required=False, allow_blank=True)
    followers = serializers.IntegerField(min_value=0, required=False)
    is_connected = serializers.BooleanField(required=False)

class CreatorRegisterSerializer(serializers.Serializer):
    user = RegisterUserSerializer()
    display_name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    category = serializers.CharField(max_length=120, required=False, allow_blank=True)
    location = serializers.CharField(max_length=500, required=False, allow_blank=True)
    country = serializers.CharField(max_length=120, required=False, allow_blank=True)
    state = serializers.CharField(max_length=120, required=False, allow_blank=True)
    district = serializers.CharField(max_length=120, required=False, allow_blank=True)
    city = serializers.CharField(max_length=120, required=False, allow_blank=True)
    postalCode = serializers.CharField(source="postal_code", max_length=32, required=False, allow_blank=True)
    streetAddress = serializers.CharField(source="street_address", max_length=255, required=False, allow_blank=True)
    languages = serializers.ListField(child=serializers.CharField(max_length=80), required=False)
    collaboration_preferences = serializers.ListField(child=serializers.CharField(max_length=120), required=False)
    social_accounts = CreatorSocialAccountInputSerializer(many=True, required=False)
    bio = serializers.CharField(required=False, allow_blank=True)
    about = serializers.CharField(required=False, allow_blank=True)
    gender = serializers.CharField(max_length=120, required=False, allow_blank=True)
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
        if phone and not OtpVerification.objects.filter(
            channel=OtpChannel.PHONE,
            target__in=otp_target_variants(OtpChannel.PHONE, phone),
            purpose="creator_registration",
            is_verified=True,
        ).exists():
            missing["phone_no"] = "Phone OTP is not verified."
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
            "video_count",
            "videos",
            "analytics",
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
            "video_count",
            "videos",
            "analytics",
            "provider_data",
            "expires_at",
            "last_synced_at",
            "created_at",
        ]


class CreatorPortfolioSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    video_url = serializers.SerializerMethodField()

    class Meta:
        model = CreatorPortfolio
        fields = ["id", "title", "sub_title", "link", "image", "image_url", "video", "video_url"]
        read_only_fields = ["id", "image_url", "video_url"]

    def _file_url(self, obj, field_name):
        file = getattr(obj, field_name)
        if not file:
            return ""
        request = self.context.get("request")
        return request.build_absolute_uri(file.url) if request else file.url

    def get_image_url(self, obj):
        return self._file_url(obj, "image")

    def get_video_url(self, obj):
        return self._file_url(obj, "video")


class CreatorSocialMediaPricingSerializer(serializers.ModelSerializer):
    class Meta:
        model = CreatorSocialMediaPricing
        fields = ["id", "social_media_name", "social_media_pricing", "is_visible"]
        read_only_fields = ["id"]

class CreatorProfileSerializer(serializers.ModelSerializer):
    user = AuthUserSerializer(read_only=True)
    contact_person_name = serializers.CharField(source="user.name", read_only=True)
    work_email = serializers.EmailField(source="user.email", read_only=True)
    contact_phone = serializers.CharField(source="user.phone_no", read_only=True)
    whatsapp_number = serializers.CharField(source="user.phone_no", read_only=True)
    social_accounts = CreatorSocialAccountSerializer(many=True, read_only=True)
    profile_image_url = serializers.SerializerMethodField()
    is_profile_visible = serializers.BooleanField(source="user.is_profile_visible", read_only=True)
    verification_status = serializers.CharField(source="user.verification_status", read_only=True)
    postalCode = serializers.CharField(source="postal_code", read_only=True)
    streetAddress = serializers.CharField(source="street_address", read_only=True)

    class Meta:
        model = CreatorProfile
        fields = [
            "creator_id",
            "user",
            "contact_person_name",
            "work_email",
            "contact_phone",
            "whatsapp_number",
            "display_name",
            "category",
            "location",
            "country",
            "state",
            "district",
            "city",
            "postalCode",
            "streetAddress",
            "languages",
            "collaboration_preferences",
            "bio",
            "about",
            "gender",
            "work_with",
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
    contact_person_name = serializers.CharField(source="user.name", read_only=True)
    work_email = serializers.EmailField(source="user.email", read_only=True)
    contact_phone = serializers.CharField(source="user.phone_no", read_only=True)
    whatsapp_number = serializers.CharField(source="user.phone_no", read_only=True)
    social_accounts = CreatorSocialAccountSerializer(many=True, read_only=True)
    profile_image_url = serializers.SerializerMethodField()
    is_profile_visible = serializers.BooleanField(source="user.is_profile_visible", read_only=True)
    verification_status = serializers.CharField(source="user.verification_status", read_only=True)
    postalCode = serializers.CharField(source="postal_code", read_only=True)
    streetAddress = serializers.CharField(source="street_address", read_only=True)

    class Meta:
        model = CreatorProfile
        fields = [
            "creator_id",
            "user",
            "contact_person_name",
            "work_email",
            "contact_phone",
            "whatsapp_number",
            "display_name",
            "category",
            "location",
            "country",
            "state",
            "district",
            "city",
            "postalCode",
            "streetAddress",
            "languages",
            "collaboration_preferences",
            "bio",
            "about",
            "gender",
            "work_with",
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
