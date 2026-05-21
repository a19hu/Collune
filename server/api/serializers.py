# from django.contrib.auth.models import User
from rest_framework import serializers
from .models import (
    User,
    BrandOnboarding,
    Category,
    BrandProfile,
    CreatorProfile,
    CreatorRating,
    SavedCreator,
    CreatorCartItem,
    SocialMediaPlatform,
)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name"]

class BrandSignUpSerializer(serializers.Serializer):
    # User fields
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
        brand_name = validated_data.pop("brand_name")
        website = validated_data.pop("website", "")
        phone_number = validated_data.pop("phone_number", "")
        password = validated_data.pop("password")
        email = validated_data["email"].strip().lower()
        validated_data["email"] = email

        if User.objects.filter(username=email).exists():
            raise serializers.ValidationError({"email": "User with this email already exists"})

        # Create user
        user = User.objects.create_user(
            username=email,
            password=password,
            role="BRAND",
            phone_number=phone_number or None,
            **validated_data
        )

        # # Create brand
        # brand = Brand.objects.create(
        #     created_by=user,
        #     brand_name=brand_name,
        #     website=website,
        #     contact_phone=phone_number,
        # )

        return {
            "user": user,
            # "brand": brand
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
        model = BrandProfile
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


        return {
            "user": user,
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
        return user


class CreatorRatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = CreatorRating
        fields = "__all__"
        read_only_fields = ["brand", "created_at"]

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("rating must be between 1 and 5")
        return value


class SavedCreatorSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedCreator
        fields = "__all__"
        read_only_fields = ["brand", "created_at"]


class CreatorCartItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = CreatorCartItem
        fields = "__all__"
        read_only_fields = ["brand", "created_at"]
