from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html

from ..models import (
    BrandProfile,
    BrandShortlist,
    Campaign,
    CampaignApplication,
    CreatorProfile,
    CreatorSocialAccount,
    User,
    UserAdminRole,
    VerificationStatus,
)


admin.site.site_header = "Collune Admin"
admin.site.site_title = "Collune Admin"
admin.site.index_title = "Workspace Control Center"


class ColluneAdminMixin:
    list_per_page = 25

    class Media:
        css = {"all": ("admin/collune-admin.css",)}


@admin.action(description="Mark selected accounts as verified")
def mark_users_verified(modeladmin, request, queryset):
    queryset.update(verification_status=VerificationStatus.VERIFIED)


@admin.action(description="Mark selected accounts as pending")
def mark_users_pending(modeladmin, request, queryset):
    queryset.update(verification_status=VerificationStatus.PENDING)


@admin.action(description="Make selected profiles visible")
def make_profiles_visible(modeladmin, request, queryset):
    for profile in queryset.select_related("user"):
        profile.user.is_profile_visible = True
        profile.user.save(update_fields=["is_profile_visible"])


@admin.action(description="Hide selected profiles")
def hide_profiles(modeladmin, request, queryset):
    for profile in queryset.select_related("user"):
        profile.user.is_profile_visible = False
        profile.user.save(update_fields=["is_profile_visible"])


@admin.action(description="Mark selected profiles as verified")
def mark_profiles_verified(modeladmin, request, queryset):
    for profile in queryset.select_related("user"):
        profile.user.verification_status = VerificationStatus.VERIFIED
        profile.user.save(update_fields=["verification_status"])


@admin.action(description="Mark selected profiles as pending")
def mark_profiles_pending(modeladmin, request, queryset):
    for profile in queryset.select_related("user"):
        profile.user.verification_status = VerificationStatus.PENDING
        profile.user.save(update_fields=["verification_status"])


@admin.register(User)
class UserAdmin(ColluneAdminMixin, BaseUserAdmin):
    model = User
    list_display = (
        "name",
        "email",
        "phone_no",
        "role",
        "verification_badge",
        "is_staff",
        "is_active",
        "last_login_at",
    )
    search_fields = ("username", "email", "phone_no", "name")
    list_filter = ("role", "verification_status", "is_staff", "is_active")
    ordering = ("-created_at",)
    readonly_fields = ("user_id", "created_at", "last_login_at")
    actions = [mark_users_verified, mark_users_pending]
    fieldsets = BaseUserAdmin.fieldsets + (
        (
            "Collune Profile",
            {
                "classes": ("wide", "collune-section"),
                "fields": (
                    "user_id",
                    "name",
                    "phone_no",
                    "role",
                    "verification_status",
                    "last_login_at",
                    "created_at",
                ),
            },
        ),
    )

    @admin.display(description="Verification")
    def verification_badge(self, obj):
        color = "#067647" if obj.verification_status == VerificationStatus.VERIFIED else "#b54708"
        bg = "#ecfdf3" if obj.verification_status == VerificationStatus.VERIFIED else "#fff7ed"
        return format_html(
            '<span style="display:inline-block;padding:4px 10px;border-radius:999px;background:{};color:{};font-weight:700;">{}</span>',
            bg,
            color,
            obj.verification_status.title(),
        )


@admin.register(BrandProfile)
class BrandProfileAdmin(ColluneAdminMixin, admin.ModelAdmin):
    list_display = (
        "company_name",
        "industry",
        "website",
        "company_size",
        "brand_email",
        "brand_phone",
        "visibility_badge",
        "verification_badge",
        "created_at",
    )
    search_fields = (
        "company_name",
        "industry",
        "website",
        "user__email",
        "user__name",
        "user__phone_no",
    )
    list_filter = ("industry", "company_size", "user__verification_status", "user__is_profile_visible", "created_at")
    list_select_related = ("user",)
    readonly_fields = ("created_at", "updated_at")
    actions = [mark_profiles_verified, mark_profiles_pending, make_profiles_visible, hide_profiles]
    fieldsets = (
        ("Brand Identity", {"classes": ("wide", "collune-section"), "fields": (("company_name", "industry"), ("logo", "website"), ("company_size",))}),
        ("Platform Status", {"classes": ("wide", "collune-section"), "fields": (("user",),)}),
        ("Metadata", {"classes": ("collapse",), "fields": ("created_at", "updated_at")}),
    )

    @admin.display(description="Email")
    def brand_email(self, obj):
        return obj.user.email if obj.user else "-"

    @admin.display(description="Phone")
    def brand_phone(self, obj):
        return obj.user.phone_no if obj.user and obj.user.phone_no else "-"

    @admin.display(description="Visible")
    def visibility_badge(self, obj):
        visible = bool(obj.user and obj.user.is_profile_visible)
        color = "#067647" if visible else "#b42318"
        bg = "#ecfdf3" if visible else "#fef3f2"
        label = "Visible" if visible else "Hidden"
        return format_html('<span style="display:inline-block;padding:4px 10px;border-radius:999px;background:{};color:{};font-weight:700;">{}</span>', bg, color, label)

    @admin.display(description="Verification")
    def verification_badge(self, obj):
        verified = obj.user.verification_status == VerificationStatus.VERIFIED
        color = "#067647" if verified else "#b54708"
        bg = "#ecfdf3" if verified else "#fff7ed"
        label = "Verified" if verified else "Pending"
        return format_html('<span style="display:inline-block;padding:4px 10px;border-radius:999px;background:{};color:{};font-weight:700;">{}</span>', bg, color, label)


@admin.register(CreatorProfile)
class CreatorProfileAdmin(ColluneAdminMixin, admin.ModelAdmin):
    list_display = ("display_name", "category", "location", "creator_email", "visibility_badge", "verification_badge", "profile_completion")
    search_fields = ("display_name", "category", "location", "user__email", "user__name")
    list_filter = ("category", "gender", "user__verification_status", "user__is_profile_visible")
    list_select_related = ("user",)
    readonly_fields = ("created_at", "updated_at", "profile_completion")
    actions = [mark_profiles_verified, mark_profiles_pending, make_profiles_visible, hide_profiles]
    fieldsets = (
        ("Creator Identity", {"classes": ("wide", "collune-section"), "fields": (("user", "display_name"), ("category", "gender"), ("profile_image",))}),
        ("Profile Details", {"classes": ("wide", "collune-section"), "fields": ("bio", "about", "location", ("country", "state", "city"), ("district", "postal_code", "street_address"))}),
        ("Preferences", {"classes": ("wide", "collune-section"), "fields": ("languages", "collaboration_preferences", "work_with")}),
        ("Metrics", {"classes": ("wide", "collune-section"), "fields": (("profile_completion",),)}),
        ("Metadata", {"classes": ("collapse",), "fields": ("created_at", "updated_at")}),
    )

    @admin.display(description="Email")
    def creator_email(self, obj):
        return obj.user.email

    @admin.display(description="Visible")
    def visibility_badge(self, obj):
        visible = bool(obj.user and obj.user.is_profile_visible)
        color = "#067647" if visible else "#b42318"
        bg = "#ecfdf3" if visible else "#fef3f2"
        label = "Visible" if visible else "Hidden"
        return format_html('<span style="display:inline-block;padding:4px 10px;border-radius:999px;background:{};color:{};font-weight:700;">{}</span>', bg, color, label)

    @admin.display(description="Verification")
    def verification_badge(self, obj):
        verified = obj.user.verification_status == VerificationStatus.VERIFIED
        color = "#067647" if verified else "#b54708"
        bg = "#ecfdf3" if verified else "#fff7ed"
        label = "Verified" if verified else "Pending"
        return format_html('<span style="display:inline-block;padding:4px 10px;border-radius:999px;background:{};color:{};font-weight:700;">{}</span>', bg, color, label)


@admin.register(CreatorSocialAccount)
class CreatorSocialAccountAdmin(ColluneAdminMixin, admin.ModelAdmin):
    list_display = ("creator", "platform", "handle", "followers", "is_connected", "last_synced_at")
    search_fields = ("creator__display_name", "platform", "handle", "username")
    list_filter = ("platform", "is_connected")
    autocomplete_fields = ("creator",)
    readonly_fields = ("created_at", "last_synced_at")


@admin.register(Campaign)
class CampaignAdmin(ColluneAdminMixin, admin.ModelAdmin):
    list_display = ("title", "brand", "category", "audience_type", "deadline", "created_at")
    search_fields = ("title", "brand__company_name", "category", "audience_type")
    list_filter = ("category", "audience_type", "compensation_type", "deadline", "created_at")
    autocomplete_fields = ("brand",)
    date_hierarchy = "created_at"
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        ("Overview", {"classes": ("wide", "collune-section"), "fields": (("brand", "title"), ("internal_reference_name", "category"), ("brief", "objective"))}),
        ("Campaign Details", {"classes": ("wide", "collune-section"), "fields": ("deliverables", "brand_requirements", "creative_direction", "tone_of_communication", "content_references")}),
        ("Targeting", {"classes": ("wide", "collune-section"), "fields": (("platforms", "location"), ("audience_type", "minimum_followers"), ("language_preference", "content_style"), ("additional_preferences",))}),
        ("Budget & Timeline", {"classes": ("wide", "collune-section"), "fields": (("total_budget", "budget_range"), ("compensation_type", "deliverable_pricing"), ("start_date", "end_date", "deadline"))}),
        ("Files", {"classes": ("wide", "collune-section"), "fields": (("cover_image", "brand_guidelines"),)}),
        ("Metadata", {"classes": ("collapse",), "fields": ("created_at", "updated_at")}),
    )


@admin.register(CampaignApplication)
class CampaignApplicationAdmin(ColluneAdminMixin, admin.ModelAdmin):
    list_display = ("campaign", "creator", "status", "quoted_rate", "created_at")
    search_fields = ("campaign__title", "creator__display_name")
    list_filter = ("status", "created_at")
    autocomplete_fields = ("campaign", "creator")
    readonly_fields = ("created_at", "updated_at")


@admin.register(BrandShortlist)
class BrandShortlistAdmin(ColluneAdminMixin, admin.ModelAdmin):
    list_display = ("title", "brand", "status", "creator_total", "created_at", "updated_at")
    search_fields = ("title", "brand__company_name", "creators__display_name")
    list_filter = ("status", "created_at", "updated_at")
    autocomplete_fields = ("brand",)
    filter_horizontal = ("creators",)
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        ("Shortlist Overview", {"classes": ("wide", "collune-section"), "fields": (("brand", "title"), ("status",), ("purpose", "notes"))}),
        ("Targeting", {"classes": ("wide", "collune-section"), "fields": (("platforms", "categories"), ("audience", "budget_range"), ("start_date", "end_date"))}),
        ("Creators", {"classes": ("wide", "collune-section"), "fields": ("creators",)}),
        ("Metadata", {"classes": ("collapse",), "fields": ("created_at", "updated_at")}),
    )

    @admin.display(description="Creators")
    def creator_total(self, obj):
        return obj.creators.count()


@admin.register(UserAdminRole)
class UserAdminRoleAdmin(ColluneAdminMixin, admin.ModelAdmin):
    list_display = ("role_id", "user", "role_name", "Purpose")
    search_fields = ("user__email", "user__name", "role_name", "Purpose")
    list_filter = ("role_name",)
    autocomplete_fields = ("user",)
