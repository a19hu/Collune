from django.core.exceptions import ObjectDoesNotExist
from rest_framework import serializers

from ..common.services import generate_username
from ..models import (
    AdminPermission,
    AdminRole,
    AdminRoleType,
    BrandProfile,
    Campaign,
    CampaignStatus,
    User,
    UserRole,
    UserAdminRole,
    VerificationStatus,
)
from .services import (
    get_internal_admin_roles,
    get_role_details,
)

# Best-effort mapping from the new editable AdminRole catalog to the legacy
# role_name TextChoices still used by the older client Admin panel.
ADMIN_ROLE_NAME_TO_LEGACY_CODE = {
    "Super Admin": AdminRoleType.SUPER_ADMIN,
    "Admin": AdminRoleType.ADMIN,
    "Operations Manager": AdminRoleType.OPERATIONS_MANAGER,
    "Creator Manager": AdminRoleType.TEAM_MEMBER,
    "Campaign Manager": AdminRoleType.PROJECT_MANAGER,
    "Brand Manager": AdminRoleType.SALES_MARKETING_MANAGER,
    "Export Team": AdminRoleType.ANALYTICS_MANAGER,
    "Finance Manager": AdminRoleType.ANALYTICS_MANAGER,
    "Support Executive": AdminRoleType.TEAM_MEMBER,
}


class AdminPermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminPermission
        fields = ["key", "label", "module", "description"]


class AdminRoleSerializer(serializers.ModelSerializer):
    permissions = serializers.SlugRelatedField(slug_field="key", many=True, read_only=True)
    user_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = AdminRole
        fields = [
            "role_id",
            "name",
            "description",
            "permissions",
            "is_wildcard",
            "is_system",
            "user_count",
            "created_at",
            "updated_at",
        ]


class AdminRoleWriteSerializer(serializers.ModelSerializer):
    permissions = serializers.ListField(child=serializers.CharField(), required=False, default=list)

    class Meta:
        model = AdminRole
        fields = ["name", "description", "permissions"]

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Role name is required.")
        queryset = AdminRole.objects.filter(name__iexact=value)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("A role with this name already exists.")
        return value

    def _apply_permissions(self, role, keys):
        is_wildcard = "*" in keys
        if role.is_wildcard != is_wildcard:
            role.is_wildcard = is_wildcard
            role.save(update_fields=["is_wildcard"])
        if is_wildcard:
            role.permissions.clear()
        else:
            role.permissions.set(AdminPermission.objects.filter(key__in=[k for k in keys if k != "*"]))

    def create(self, validated_data):
        keys = validated_data.pop("permissions", [])
        role = AdminRole.objects.create(**validated_data)
        self._apply_permissions(role, keys)
        return role

    def update(self, instance, validated_data):
        keys = validated_data.pop("permissions", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if keys is not None:
            self._apply_permissions(instance, keys)
        return instance


class AdminManagedUserSerializer(serializers.ModelSerializer):
    userrole = serializers.SerializerMethodField()

    def get_userrole(self, obj):
        try:
            role_details = obj.role_details
        except ObjectDoesNotExist:
            return None
        payload = {
            "role_name": role_details.role_name,
            "permissions": role_details.permissions,
            "Purpose": role_details.Purpose,
        }
        assigned_role = role_details.assigned_role
        if assigned_role:
            payload["assigned_role"] = {
                "role_id": str(assigned_role.role_id),
                "name": assigned_role.name,
                "is_wildcard": assigned_role.is_wildcard,
                "permissions": list(assigned_role.permissions.values_list("key", flat=True)),
            }
        return payload

    class Meta:
        model = User
        fields = [
            "user_id",
            "name",
            "email",
            "phone_no",
            "verification_status",
            "is_active",
            "created_at",
            "last_login_at",
            "userrole",
        ]


class AdminUserCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    phone_no = serializers.CharField(max_length=20, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=UserAdminRole._meta.get_field("role_name").choices, required=False)
    assigned_role_name = serializers.CharField(max_length=120, required=False, allow_blank=True)
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

    def validate_assigned_role_name(self, value):
        if value and not AdminRole.objects.filter(name=value).exists():
            raise serializers.ValidationError("Unknown role.")
        return value

    def validate(self, attrs):
        if not attrs.get("role") and not attrs.get("assigned_role_name"):
            raise serializers.ValidationError({"role": "Either 'role' or 'assigned_role_name' is required."})
        return attrs

    def create(self, validated_data):
        email = validated_data["email"]
        assigned_role_name = validated_data.get("assigned_role_name")
        assigned_role = AdminRole.objects.filter(name=assigned_role_name).first() if assigned_role_name else None

        role = validated_data.get("role") or ADMIN_ROLE_NAME_TO_LEGACY_CODE.get(assigned_role_name, AdminRoleType.TEAM_MEMBER)

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
            permissions=assigned_role.description if assigned_role else role_details["description"],
            Purpose=assigned_role.description if assigned_role else role_details["purpose"],
            assigned_role=assigned_role,
        )

        return user


class AdminCampaignWriteSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
    brand_id = serializers.UUIDField()
    category = serializers.CharField(max_length=120, required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)
    objective = serializers.CharField(required=False, allow_blank=True)
    target_audience = serializers.CharField(max_length=120, required=False, allow_blank=True)
    platforms = serializers.ListField(child=serializers.CharField(), required=False)
    budget = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    deliverables_text = serializers.CharField(required=False, allow_blank=True)
    start_date = serializers.DateField(required=False, allow_null=True)
    end_date = serializers.DateField(required=False, allow_null=True)
    status = serializers.ChoiceField(choices=CampaignStatus.choices, required=False)

    FIELD_MAP = {
        "title": "title",
        "description": "brief",
        "objective": "objective",
        "target_audience": "audience_type",
        "category": "category",
        "platforms": "platforms",
        "budget": "total_budget",
        "deliverables_text": "deliverables",
        "start_date": "start_date",
        "end_date": "end_date",
        "status": "status",
    }

    def validate_brand_id(self, value):
        if not BrandProfile.objects.filter(brand_id=value).exists():
            raise serializers.ValidationError("Brand not found.")
        return value

    def create(self, validated_data):
        brand = BrandProfile.objects.get(brand_id=validated_data.pop("brand_id"))
        fields = {self.FIELD_MAP[key]: value for key, value in validated_data.items() if key in self.FIELD_MAP}
        return Campaign.objects.create(brand=brand, **fields)

    def update(self, instance, validated_data):
        brand_id = validated_data.pop("brand_id", None)
        if brand_id:
            instance.brand = BrandProfile.objects.get(brand_id=brand_id)
        for key, value in validated_data.items():
            if key in self.FIELD_MAP:
                setattr(instance, self.FIELD_MAP[key], value)
        instance.save()
        return instance
