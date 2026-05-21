# from django.contrib.auth.models import User
from rest_framework import serializers
from .models import (
    Role,
    User,
    Brand,
    BrandOnboarding,
    Creator,
    CreatorPlatform,
    Campaign,
    CampaignBrief,
    CampaignCreator,
    Deliverable,
    Report,
    Invoice,
    Category,
    Tag,
    BrandProfile,
    Address,
    SocialMediaPlatform,
)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name"]

class BrandSignUpSerializer(serializers.Serializer):
    # User fields
    username = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    first_name = serializers.CharField()
    last_name = serializers.CharField()

    # Brand fields
    brand_name = serializers.CharField()
    website = serializers.URLField(required=False, allow_blank=True)
    phone_number = serializers.CharField(required=False, allow_blank=True)

    def create(self, validated_data):
        # Extract brand data
        username = validated_data.pop("username", "")
        brand_name = validated_data.pop("brand_name")
        website = validated_data.pop("website", "")
        phone_number = validated_data.pop("phone_number", "")

        password = validated_data.pop("password")

        if not username:
            base = (validated_data["email"].split("@")[0] or "brand").strip().lower()
            candidate = base
            idx = 1
            while User.objects.filter(username=candidate).exists():
                idx += 1
                candidate = f"{base}{idx}"
            username = candidate

        # Create user
        user = User.objects.create_user(
            username=username,
            password=password,
            role="BRAND",
            phone_number=phone_number or None,
            **validated_data
        )

        # Create brand
        brand = Brand.objects.create(
            created_by=user,
            brand_name=brand_name,
            website=website,
            contact_phone=phone_number,
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


class BrandProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = BrandProfile
        fields = "__all__"


class BrandProfileDetailsSerializer(serializers.ModelSerializer):
    street = serializers.CharField(required=False, allow_blank=True)
    city = serializers.CharField(required=False, allow_blank=True)
    state = serializers.CharField(required=False, allow_blank=True)
    postal_code = serializers.CharField(required=False, allow_blank=True)
    country = serializers.CharField(required=False, allow_blank=True)
    company_category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), many=True, required=False
    )

    class Meta:
        model = BrandProfile
        fields = [
            "company_discription",
            "company_category",
            "street",
            "city",
            "state",
            "postal_code",
            "country",
        ]


class BrandProfileSocialSerializer(serializers.Serializer):
    website = serializers.URLField(required=False, allow_blank=True)
    youtube = serializers.URLField(required=False, allow_blank=True)
    instagram = serializers.URLField(required=False, allow_blank=True)
    facebook = serializers.URLField(required=False, allow_blank=True)
    x = serializers.URLField(required=False, allow_blank=True)


class BrandProfileImagesSerializer(serializers.ModelSerializer):
    class Meta:
        model = BrandProfile
        fields = ["logo", "cover_photo"]

class SignUpCreatorSerializer(serializers.Serializer):
    # User fields
    username = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    first_name = serializers.CharField()
    last_name = serializers.CharField()

    # Creator fields
    phone_number = serializers.CharField()

    def create(self, validated_data):
        # Extract creator data
        phone_number = validated_data.pop("phone_number")

        password = validated_data.pop("password")

        # Create user
        user = User.objects.create_user(
            password=password,
            role="CREATOR",
            phone_number=phone_number,
            **validated_data
        )

        # Create creator
        creator = Creator.objects.create(
            user=user,
            display_name=f"{validated_data['first_name']} {validated_data['last_name']}".strip(),
        )

        return {
            "user": user,
            "creator": creator
        }
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


class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = "__all__"


class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = "__all__"
