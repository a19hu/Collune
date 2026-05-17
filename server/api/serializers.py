from django.contrib.auth.models import User
from rest_framework import serializers
from .models import (
    Role,
    Brand,
    BrandOnboarding,
    Creator,
    CreatorPlatform,
    Campaign,
    CampaignBrief,
    CampaignCreator,
    Deliverable,
    AnalyticsSnapshot,
    Report,
    Invoice,
    Payout,
    Notification,
    ChatRoom,
    ChatMessage,
    Category,
    Tag,
    AIInteraction,
)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name"]

class BrandSignUpSerializer(serializers.Serializer):
    # User fields
    username = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    first_name = serializers.CharField()
    last_name = serializers.CharField()

    # Brand fields
    brand_name = serializers.CharField()
    website = serializers.URLField(required=False, allow_blank=True)
    contact_phone = serializers.CharField(required=False, allow_blank=True)

    def create(self, validated_data):
        # Extract brand data
        brand_name = validated_data.pop("brand_name")
        website = validated_data.pop("website", "")
        contact_phone = validated_data.pop("contact_phone", "")

        password = validated_data.pop("password")

        # Create user
        user = User.objects.create_user(
            password=password,
            **validated_data
        )

        # Create brand
        brand = Brand.objects.create(
            created_by=user,
            brand_name=brand_name,
            website=website,
            contact_phone=contact_phone,
        )

        return {
            "user": user,
            "brand": brand
        }
    
class BrandOnboardingSerializer(serializers.ModelSerializer):

    class Meta:
        model = BrandOnboarding
        fields = [
            "company_size",
            "annual_marketing_budget",
            "social_media_content_focus",
            "company_type",
            "what_brings_you_to_collune",
        ]

class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = [
            "brand_name",
            "website",
            "contact_phone",
            "created_by",
        ]
        read_only_fields = ["created_by"]

class SignUpSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    role_code = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "email", "password", "first_name", "last_name", "role_code"]

    def create(self, validated_data):
        role_code = validated_data.pop("role_code")
        password = validated_data.pop("password")
        user = User.objects.create_user(password=password, **validated_data)
        role = Role.objects.get(code=role_code)
        return user


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = "__all__"



class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = "__all__"





class CreatorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Creator
        fields = "__all__"


class CreatorPlatformSerializer(serializers.ModelSerializer):
    class Meta:
        model = CreatorPlatform
        fields = "__all__"


class CampaignBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = CampaignBrief
        fields = "__all__"


class CampaignSerializer(serializers.ModelSerializer):
    class Meta:
        model = Campaign
        fields = "__all__"


class CampaignCreatorSerializer(serializers.ModelSerializer):
    class Meta:
        model = CampaignCreator
        fields = "__all__"


class DeliverableSerializer(serializers.ModelSerializer):
    class Meta:
        model = Deliverable
        fields = "__all__"


class AnalyticsSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnalyticsSnapshot
        fields = "__all__"


class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = "__all__"


class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = "__all__"


class PayoutSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payout
        fields = "__all__"


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = "__all__"


class ChatRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatRoom
        fields = "__all__"


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = "__all__"



class AIInteractionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIInteraction
        fields = "__all__"


