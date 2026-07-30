from django.contrib.auth.models import Permission
from rest_framework import serializers

from ..common.services import generate_username
from ..models import User, UserRole, UserAdminRole
from .services import get_default_permissions_for_role


class AdminPermissionSerializer(serializers.ModelSerializer):
    app_label = serializers.CharField(source="content_type.app_label", read_only=True)
    model = serializers.CharField(source="content_type.model", read_only=True)

    class Meta:
        model = Permission
        fields = ["id", "name", "codename", "app_label", "model"]


class AdminManagedUserSerializer(serializers.ModelSerializer):
    permissions = AdminPermissionSerializer(source="user_permissions", many=True, read_only=True)

    class Meta:
        model = User
        fields = [
            "user_id",
            "name",
            "email",
            "phone_no",
            "role",
            "verification_status",
            "is_profile_visible",
            "is_active",
            "permissions",
        ]


class AdminUserCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    phone_no = serializers.CharField(max_length=20, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=UserAdminRole.choices)
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
        if value not in UserAdminRole.internal_roles():
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
            is_active=validated_data.get("is_active", True),
        )
        # permission_ids = {permission.id for permission in default_permissions}
        # permission_ids.update(permission.id for permission in permissions)
        # if permission_ids:
        #     user.user_permissions.set(Permission.objects.filter(id__in=permission_ids))
        useradminrole = UserAdminRole.objects.create_user(
            user = user,
            role_name= role,
            permissions = 
            Purpose = 

        )

        return user
