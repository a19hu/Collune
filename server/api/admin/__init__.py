from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import Group

from ..models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = (
        "email",
        "name",
        "role",
        "verification_status",
        "is_active",
        "is_staff",
        "created_at",
    )
    list_filter = ("role", "verification_status", "is_active", "is_staff", "is_superuser")
    search_fields = ("email", "name", "username", "phone_no")
    ordering = ("-created_at",)

    fieldsets = (
        (None, {"fields": ("username", "password")}),
        ("Personal info", {"fields": ("name", "email", "phone_no")}),
        ("Access", {"fields": ("role", "verification_status")}),
        (
            "Permissions",
            {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")},
        ),
        ("Important dates", {"fields": ("last_login", "last_login_at", "created_at")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "username",
                    "email",
                    "name",
                    "phone_no",
                    "role",
                    "verification_status",
                    "password1",
                    "password2",
                    "is_active",
                    "is_staff",
                    "is_superuser",
                ),
            },
        ),
    )
    readonly_fields = ("created_at", "last_login_at", "last_login")


try:
    admin.site.unregister(Group)
except admin.sites.NotRegistered:
    pass
