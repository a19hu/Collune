from rest_framework import serializers

from ..models import (
    ApplicationStatus,
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

    def get_active_campaigns_count(self, obj):
        return Campaign.objects.filter(
            brand=obj,
            status__in=[CampaignStatus.ACTIVE, CampaignStatus.PAUSED],
        ).count()

    def get_active_shortlists_count(self, obj):
        return BrandShortlist.objects.filter(
            brand=obj,
            status=ShortlistStatus.ACTIVE,
        ).count()


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

class CampaignStatusSummarySerializer(serializers.Serializer):
    summary_id = serializers.SerializerMethodField()
    campaign = serializers.SerializerMethodField()
    applications_received = serializers.SerializerMethodField()
    recommended_creators = serializers.SerializerMethodField()
    collaborations_started = serializers.SerializerMethodField()
    applications_close_in_days = serializers.SerializerMethodField()
    created_at = serializers.SerializerMethodField()
    updated_at = serializers.SerializerMethodField()

    def _campaign(self, obj):
        return obj if isinstance(obj, Campaign) else obj.campaign

    def _summary(self, obj):
        return None if isinstance(obj, Campaign) else obj

    def get_summary_id(self, obj):
        summary = self._summary(obj)
        return str(summary.summary_id) if summary else str(self._campaign(obj).campaign_id)

    def get_campaign(self, obj):
        return str(self._campaign(obj).campaign_id)

    def get_applications_received(self, obj):
        campaign = self._campaign(obj)
        if hasattr(campaign, "applications_received_count"):
            return campaign.applications_received_count
        return CampaignApplication.objects.filter(campaign=campaign).count()

    def get_recommended_creators(self, obj):
        campaign = self._campaign(obj)
        if hasattr(campaign, "recommended_creators_count"):
            return campaign.recommended_creators_count
        return CampaignApplication.objects.filter(
            campaign=campaign,
            status=ApplicationStatus.ACCEPTED,
        ).count()

    def get_collaborations_started(self, obj):
        summary = self._summary(obj)
        return summary.collaborations_started if summary else 0

    def get_applications_close_in_days(self, obj):
        summary = self._summary(obj)
        return summary.applications_close_in_days if summary else 0

    def get_created_at(self, obj):
        summary = self._summary(obj)
        return (summary.created_at if summary else self._campaign(obj).created_at).isoformat()

    def get_updated_at(self, obj):
        summary = self._summary(obj)
        return (summary.updated_at if summary else self._campaign(obj).updated_at).isoformat()

class CampaignSerializer(serializers.ModelSerializer):
    brand_detail = BrandProfileSerializer(source="brand", read_only=True)
    applications_count = serializers.IntegerField(source="applications.count", read_only=True)
    brand_guidelines_url = serializers.SerializerMethodField()
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

    def get_status_summary(self, obj):
        return CampaignStatusSummarySerializer(obj, context=self.context).data

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
    creator_details = CreatorProfileSerializer(source="creators", many=True, read_only=True)
    creators = serializers.PrimaryKeyRelatedField(queryset=CreatorProfile.objects.all(), many=True, required=False)

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
            "timeline",
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
