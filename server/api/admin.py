from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import (
    BrandProfile,
    BrandShortlist,
    Campaign,
    CampaignApplication,
    CampaignProgress,
    CampaignStatusSummary,
    CreatorProfile,
    CreatorSocialAccount,
    User,
)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    model = User
    list_display = ("user_id", "username", "email", "phone_no", "role", "is_staff", "is_active")
    search_fields = ("username", "email", "phone_no", "name")
    list_filter = ("role", "is_staff", "is_active")
    ordering = ("username",)
    fieldsets = BaseUserAdmin.fieldsets + (
        ("Collune Profile", {"fields": ("user_id", "name", "phone_no", "role", "status", "last_login_at", "created_at")}),
    )
    readonly_fields = ("user_id", "created_at")


@admin.register(BrandProfile)
class BrandProfileAdmin(admin.ModelAdmin):
    list_display = ("company_name", "industry", "verification_status", "profile_completion", "created_at")
    search_fields = ("company_name", "industry", "user__email", "user__name")
    list_filter = ("verification_status", "industry")


@admin.register(CreatorProfile)
class CreatorProfileAdmin(admin.ModelAdmin):
    list_display = ("display_name", "category", "audience_size", "verification_status", "profile_completion")
    search_fields = ("display_name", "category", "user__email", "user__name")
    list_filter = ("verification_status", "category")


@admin.register(CreatorSocialAccount)
class CreatorSocialAccountAdmin(admin.ModelAdmin):
    list_display = ("creator", "platform", "handle", "is_connected")
    search_fields = ("creator__display_name", "platform", "handle")
    list_filter = ("platform", "is_connected")


@admin.register(Campaign)
class CampaignAdmin(admin.ModelAdmin):
    list_display = ("title", "brand", "category", "status", "deadline", "created_at")
    search_fields = ("title", "brand__company_name", "category")
    list_filter = ("status", "category")


@admin.register(CampaignApplication)
class CampaignApplicationAdmin(admin.ModelAdmin):
    list_display = ("campaign", "creator", "quoted_rate", "status", "created_at")
    search_fields = ("campaign__title", "creator__display_name")
    list_filter = ("status",)


@admin.register(CampaignStatusSummary)
class CampaignStatusSummaryAdmin(admin.ModelAdmin):
    list_display = ("campaign", "applications_received", "recommended_creators", "collaborations_started", "updated_at")
    search_fields = ("campaign__title", "campaign__brand__company_name")


@admin.register(CampaignProgress)
class CampaignProgressAdmin(admin.ModelAdmin):
    list_display = ("campaign", "title", "status", "display_date", "sort_order")
    search_fields = ("campaign__title", "title")
    list_filter = ("status",)
    ordering = ("campaign", "sort_order")


@admin.register(BrandShortlist)
class BrandShortlistAdmin(admin.ModelAdmin):
    list_display = ("title", "brand", "status", "created_at", "updated_at")
    search_fields = ("title", "brand__company_name", "creators__display_name")
    list_filter = ("status",)
    filter_horizontal = ("creators",)
