from django.core.exceptions import ObjectDoesNotExist
from rest_framework import serializers

from ..common.services import generate_username
from ..models import User, UserRole, UserAdminRole,VerificationStatus
from .services import (
    get_internal_admin_roles,
    get_role_details,
)


class AdminManagedUserSerializer(serializers.ModelSerializer):
    userrole = serializers.SerializerMethodField()

    def get_userrole(self, obj):
        try:
            role_details = obj.role_details
        except ObjectDoesNotExist:
            return None
        return {
            "role_name": role_details.role_name,
            "permissions": role_details.permissions,
            "Purpose": role_details.Purpose,
        }

    class Meta:
        model = User
        fields = [
            "user_id",
            "name",
            "email",
            "phone_no",
            "verification_status",
            "is_active",
            "userrole",
        ]


class AdminUserCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    phone_no = serializers.CharField(max_length=20, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=UserAdminRole._meta.get_field("role_name").choices)
    is_active = serializers.BooleanField(required=False, default=True)

    def validate_email(self, value):
        value = value.lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("This email is already registered.")
        return value

    def validate_phone_no(self, value):
        if value and User.objects.filter(phone_no=value).exists():
            raise serializers.ValidationError("This phone number is already registered.")
        return value

    def validate_role(self, value):
        if value not in get_internal_admin_roles():
            raise serializers.ValidationError("Only internal workspace users can be created from this section.")
        return value

    def create(self, validated_data):
        email = validated_data["email"]
        role = validated_data["role"]

        user = User.objects.create_user(
            username=generate_username(email),
            email=email,
            password=validated_data["password"],
            name=validated_data["name"],
            phone_no=validated_data.get("phone_no") or None,
            role=UserRole.ADMIN,
            verification_status = VerificationStatus.VERIFIED,
            is_active=validated_data.get("is_active", True),
        )

        role_details = get_role_details(role)
        UserAdminRole.objects.create(
            user=user,
            role_name=role,
            permissions=role_details["description"],
            Purpose=role_details["purpose"],
        )

        return user
