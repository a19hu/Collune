from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import (
    ApplicationStatus,
    BrandProfile,
    BrandShortlist,
    Campaign,
    CampaignApplication,
    CampaignProgress,
    CampaignProgressStatus,
    CampaignStatus,
    CampaignStatusSummary,
    CreatorProfile,
    CreatorSocialAccount,
    OtpChannel,
    OtpVerification,
    SocialPlatform,
    UserRole,
    VerificationStatus,
)

User = get_user_model()


class AuthUserSerializer(serializers.ModelSerializer):
    school = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["user_id", "username", "email", "name", "phone_no", "role", "school", "is_active"]

    def get_school(self, obj):
        if hasattr(obj, "brand_profile"):
            return str(obj.brand_profile.brand_id)
        if hasattr(obj, "creator_profile"):
            return str(obj.creator_profile.creator_id)
        return None


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    school_domain = serializers.CharField(required=False, allow_blank=True)


class EmailAvailabilitySerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        return value.strip().lower()


class RegisterUserSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    phone_no = serializers.CharField(max_length=20, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=8)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("This email is already registered.")
        return value.lower()

    def validate_phone_no(self, value):
        if value and User.objects.filter(phone_no=value).exists():
            raise serializers.ValidationError("This phone number is already registered.")
        return value


class OtpSendSerializer(serializers.Serializer):
    channel = serializers.ChoiceField(choices=OtpChannel.choices)
    target = serializers.CharField(max_length=255)

    def validate_target(self, value):
        return value.strip().lower() if "@" in value else value.strip().replace(" ", "")


class OtpVerifySerializer(OtpSendSerializer):
    code = serializers.CharField(max_length=6, min_length=6)


class BrandRegisterSerializer(serializers.Serializer):
    user = RegisterUserSerializer()
    company_name = serializers.CharField(max_length=255)
    industry = serializers.CharField(max_length=120, required=False, allow_blank=True)
    website = serializers.URLField(required=False, allow_blank=True)
    company_size = serializers.CharField(max_length=64, required=False, allow_blank=True)
    linkedin_url = serializers.URLField(required=False, allow_blank=True)
    logo = serializers.ImageField(required=False, allow_null=True)


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
    preferred_response_time = serializers.CharField(max_length=80, required=False, allow_blank=True)
    open_to_travel = serializers.BooleanField(required=False)
    social_accounts = CreatorSocialAccountInputSerializer(many=True, required=False)
    bio = serializers.CharField(required=False, allow_blank=True)
    portfolio_url = serializers.URLField(required=False, allow_blank=True)
    profile_image = serializers.ImageField(required=False, allow_null=True)
    audience_size = serializers.IntegerField(min_value=0, required=False)
    rate_min = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0, required=False)
    rate_max = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0, required=False)

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
            target=phone,
            purpose="creator_registration",
            is_verified=True,
        ).exists():
            missing["phone_no"] = "Phone OTP is not verified."
        if missing:
            raise serializers.ValidationError({"otp": missing})
        return attrs


class BrandProfileSerializer(serializers.ModelSerializer):
    user = AuthUserSerializer(read_only=True)
    logo_url = serializers.SerializerMethodField()

    class Meta:
        model = BrandProfile
        fields = [
            "brand_id",
            "user",
            "company_name",
            "industry",
            "website",
            "company_size",
            "linkedin_url",
            "logo",
            "logo_url",
            "verification_status",
            "profile_completion",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["brand_id", "user", "created_at", "updated_at"]

    def get_logo_url(self, obj):
        request = self.context.get("request")
        if not obj.logo:
            return ""
        return request.build_absolute_uri(obj.logo.url) if request else obj.logo.url


class CreatorSocialAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = CreatorSocialAccount
        fields = ["account_id", "creator", "platform", "handle", "url", "followers", "is_connected", "created_at"]
        read_only_fields = ["account_id", "creator", "created_at"]


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
            "preferred_response_time",
            "open_to_travel",
            "bio",
            "portfolio_url",
            "profile_image",
            "profile_image_url",
            "audience_size",
            "rate_min",
            "rate_max",
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


class CampaignStatusSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = CampaignStatusSummary
        fields = [
            "summary_id",
            "campaign",
            "applications_received",
            "recommended_creators",
            "collaborations_started",
            "applications_close_in_days",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["summary_id", "created_at", "updated_at"]


class CampaignProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = CampaignProgress
        fields = [
            "progress_id",
            "campaign",
            "title",
            "status",
            "display_date",
            "sort_order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["progress_id", "created_at", "updated_at"]

    def validate_status(self, value):
        if value not in CampaignProgressStatus.values:
            raise serializers.ValidationError("Invalid campaign progress status.")
        return value


class CampaignSerializer(serializers.ModelSerializer):
    brand_detail = BrandProfileSerializer(source="brand", read_only=True)
    applications_count = serializers.IntegerField(source="applications.count", read_only=True)
    brand_guidelines_url = serializers.SerializerMethodField()
    status_summary = CampaignStatusSummarySerializer(read_only=True)
    progress_steps = CampaignProgressSerializer(many=True, read_only=True)

    class Meta:
        model = Campaign
        fields = [
            "campaign_id",
            "brand",
            "brand_detail",
            "title",
            "internal_reference_name",
            "brief",
            "objective",
            "deliverables",
            "brand_requirements",
            "creative_direction",
            "tone_of_communication",
            "brand_guidelines",
            "brand_guidelines_url",
            "content_references",
            "platforms",
            "category",
            "audience_type",
            "location",
            "minimum_followers",
            "language_preference",
            "content_style",
            "additional_preferences",
            "total_budget",
            "budget_range",
            "compensation_type",
            "deliverable_pricing",
            "start_date",
            "end_date",
            "deadline",
            "cover_image",
            "status",
            "status_summary",
            "progress_steps",
            "applications_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["campaign_id", "brand", "created_at", "updated_at"]

    def get_brand_guidelines_url(self, obj):
        request = self.context.get("request")
        if not obj.brand_guidelines:
            return ""
        return request.build_absolute_uri(obj.brand_guidelines.url) if request else obj.brand_guidelines.url

    def validate(self, attrs):
        attrs = super().validate(attrs)
        if not attrs.get("brief") and attrs.get("objective"):
            attrs["brief"] = attrs["objective"]
        if not attrs.get("objective") and attrs.get("brief"):
            attrs["objective"] = attrs["brief"]
        if attrs.get("end_date") and attrs.get("start_date") and attrs["end_date"] < attrs["start_date"]:
            raise serializers.ValidationError({"end_date": "End date cannot be before start date."})
        return attrs


class CampaignApplicationSerializer(serializers.ModelSerializer):
    campaign_detail = CampaignSerializer(source="campaign", read_only=True)
    creator_detail = CreatorProfileSerializer(source="creator", read_only=True)

    class Meta:
        model = CampaignApplication
        fields = [
            "application_id",
            "campaign",
            "campaign_detail",
            "creator",
            "creator_detail",
            "pitch",
            "quoted_rate",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["application_id", "creator", "created_at", "updated_at"]


class BrandShortlistSerializer(serializers.ModelSerializer):
    creator_detail = CreatorProfileSerializer(source="creator", read_only=True)

    class Meta:
        model = BrandShortlist
        fields = ["shortlist_id", "brand", "creator", "creator_detail", "notes", "created_at"]
        read_only_fields = ["shortlist_id", "brand", "created_at"]
