from rest_framework import serializers

from ..models import (
    BrandProfile,
    BrandShortlist,
    Campaign,
    CampaignApplication,
    CreatorProfile,
    ShortlistStatus,
)
from ..common.serializers import AuthUserSerializer, RegisterUserSerializer
from ..creator.serializers import CreatorProfileSerializer


class BrandRegisterSerializer(serializers.Serializer):
    user = RegisterUserSerializer()
    company_name = serializers.CharField(max_length=255)
    industry = serializers.CharField(max_length=120, required=False, allow_blank=True)
    website = serializers.URLField(required=False, allow_blank=True)
    company_size = serializers.CharField(max_length=64, required=False, allow_blank=True)
    linkedin_url = serializers.URLField(required=False, allow_blank=True)
    logo = serializers.ImageField(required=False, allow_null=True)

class BrandDashboardSerializer(serializers.Serializer):
    brand = serializers.SerializerMethodField()
    active_campaigns_count = serializers.SerializerMethodField()
    active_shortlists_count = serializers.SerializerMethodField()

    def get_brand(self, obj):
        return BrandProfileSerializer(obj).data

    def get_active_shortlists_count(self, obj):
        return BrandShortlist.objects.filter(
            brand=obj,
            status=ShortlistStatus.ACTIVE,
        ).count()


class BrandProfileSerializer(serializers.ModelSerializer):
    user = AuthUserSerializer(read_only=True)
    logo_url = serializers.SerializerMethodField()
    is_profile_visible = serializers.BooleanField(source="user.is_profile_visible", read_only=True)
    verification_status = serializers.CharField(source="user.verification_status", read_only=True)
    profile_completion = serializers.SerializerMethodField()

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
            "is_profile_visible",
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

    def get_profile_completion(self, obj):
        fields = [
            obj.company_name,
            obj.industry,
            obj.website,
            obj.company_size,
            obj.linkedin_url,
            obj.logo,
        ]
        filled = sum(bool(value) for value in fields)
        return round((filled / len(fields)) * 100) if fields else 0


class CampaignSerializer(serializers.ModelSerializer):
    brand_detail = BrandProfileSerializer(source="brand", read_only=True)
    applications_count = serializers.IntegerField(source="applications.count", read_only=True)
    brand_guidelines_url = serializers.SerializerMethodField()
    cover_image = serializers.SerializerMethodField()
    status_summary = serializers.SerializerMethodField()

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

    def get_cover_image(self, obj):
        request = self.context.get("request")
        if not obj.cover_image:
            return ""
        return request.build_absolute_uri(obj.cover_image.url) if request else obj.cover_image.url

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
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["application_id", "creator", "created_at", "updated_at"]

class BrandShortlistSerializer(serializers.ModelSerializer):
    creator_details = CreatorProfileSerializer(source="creators", many=True, read_only=True)
    creators = serializers.PrimaryKeyRelatedField(queryset=CreatorProfile.objects.filter(user__is_profile_visible=True), many=True, required=False)

    class Meta:
        model = BrandShortlist
        fields = [
            "shortlist_id",
            "brand",
            "title",
            "creators",
            "creator_details",
            "status",
            "purpose",
            "notes",
            "platforms",
            "categories",
            "audience",
            "budget_range",
            "start_date",
            "end_date",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["shortlist_id", "brand", "creator_details", "created_at", "updated_at"]

    def create(self, validated_data):
        creators = validated_data.pop("creators", [])
        shortlist = BrandShortlist.objects.create(**validated_data)
        if creators:
            shortlist.creators.set(creators)
        return shortlist

    def update(self, instance, validated_data):
        creators = validated_data.pop("creators", None)
        instance = super().update(instance, validated_data)
        if creators is not None:
            instance.creators.set(creators)
        return instance

    def validate_status(self, value):
        if value not in ShortlistStatus.values:
            raise serializers.ValidationError("Invalid shortlist status.")
        return value
