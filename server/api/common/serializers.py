from django.contrib.auth import authenticate, get_user_model
from rest_framework import serializers

from ..models import OtpChannel, UserRole

User = get_user_model()


class AuthUserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    profile_id = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["user_id", "name", "email", "role", "verification_status", "profile_id"]

    def get_role(self, obj):
        role_map = {
            UserRole.ADMIN: "Admin",
            UserRole.BRAND: "Brand",
            UserRole.CREATOR: "Creator",
        }
        return role_map.get(obj.role, obj.role)

    def get_profile_id(self, obj):
        if hasattr(obj, "brand_profile"):
            return str(obj.brand_profile.brand_id)
        if hasattr(obj, "creator_profile"):
            return str(obj.creator_profile.creator_id)
        return None

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        username = attrs.get("username")
        password = attrs.get("password")
        user = authenticate(username=username, password=password)
        if not user:
            user_obj = User.objects.filter(email__iexact=username).first()
            if user_obj:
                user = authenticate(username=user_obj.username, password=password)

        if not user:
            raise serializers.ValidationError("Invalid username or password.")

        attrs["user"] = user
        return attrs

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


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        return value.strip().lower()


class PasswordResetConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6, min_length=6)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_email(self, value):
        return value.strip().lower()
