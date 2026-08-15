import csv
import io
import json
from decimal import Decimal, InvalidOperation

from django import forms
from django.contrib import admin, messages
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.core.exceptions import PermissionDenied, ValidationError
from django.db import models
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import path, reverse
from django.utils.dateparse import parse_date, parse_datetime
from django.utils.html import format_html

from .models import (
    ApplicationStatus,
    BrandProfile,
    BrandShortlist,
    Campaign,
    CampaignApplication,
    CreatorProfile,
    CreatorSocialAccount,
    ShortlistStatus,
    User,
    UserAdminRole,
    VerificationStatus,
)


admin.site.site_header = "Collune Admin"
admin.site.site_title = "Collune Admin"
admin.site.index_title = "Workspace Control Center"


class CSVImportForm(forms.Form):
    csv_file = forms.FileField(help_text="Upload a UTF-8 CSV file using the template columns.")


class ColluneAdminMixin:
    list_per_page = 25
    change_list_template = "admin/collune_change_list.html"
    export_fields = ()
    import_fields = ()
    import_id_field = None

    class Media:
        css = {"all": ("admin/collune-admin.css",)}

    def get_urls(self):
        opts = self.model._meta
        custom_urls = [
            path(
                "export-csv/",
                self.admin_site.admin_view(self.export_csv_view),
                name=f"{opts.app_label}_{opts.model_name}_export_csv",
            ),
            path(
                "import-csv/",
                self.admin_site.admin_view(self.import_csv_view),
                name=f"{opts.app_label}_{opts.model_name}_import_csv",
            ),
            path(
                "template-csv/",
                self.admin_site.admin_view(self.download_csv_template_view),
                name=f"{opts.app_label}_{opts.model_name}_template_csv",
            ),
        ]
        return custom_urls + super().get_urls()

    def get_export_fields(self):
        if self.export_fields:
            return self.export_fields
        fields = []
        for field in self.model._meta.get_fields():
            if field.auto_created and not field.concrete:
                continue
            if field.many_to_one or field.one_to_one or field.many_to_many or getattr(field, "concrete", False):
                if getattr(field, "name", None):
                    fields.append(field.name)
        return tuple(fields)

    def get_import_fields(self):
        return self.import_fields or self.get_export_fields()

    def get_import_id_field(self):
        return self.import_id_field or self.model._meta.pk.name

    def has_import_permission(self, request):
        return self.has_add_permission(request) or self.has_change_permission(request)

    def has_export_permission(self, request):
        return self.has_view_permission(request)

    @admin.action(description="Export selected rows as CSV")
    def export_selected_as_csv(self, request, queryset):
        return self.build_csv_response(queryset, filename_suffix="selected")

    def export_csv_view(self, request):
        if not self.has_export_permission(request):
            raise PermissionDenied
        queryset = self.get_changelist_instance(request).get_queryset(request)
        return self.build_csv_response(queryset)

    def download_csv_template_view(self, request):
        if not self.has_import_permission(request):
            raise PermissionDenied
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = f'attachment; filename="{self.model._meta.model_name}_template.csv"'
        writer = csv.writer(response)
        writer.writerow(self.get_import_fields())
        return response

    def build_csv_response(self, queryset, filename_suffix="export"):
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = f'attachment; filename="{self.model._meta.model_name}_{filename_suffix}.csv"'
        writer = csv.writer(response)
        fields = self.get_export_fields()
        writer.writerow(fields)
        for obj in queryset:
            writer.writerow([self.serialize_field_value(obj, field_name) for field_name in fields])
        return response

    def serialize_field_value(self, obj, field_name):
        field = self.model._meta.get_field(field_name)
        value = getattr(obj, field_name)
        if field.many_to_many:
            return ",".join(str(item.pk) for item in value.all())
        if field.many_to_one or field.one_to_one:
            related_obj = value
            return "" if related_obj is None else str(related_obj.pk)
        if isinstance(field, models.JSONField):
            return json.dumps(value if value is not None else field.get_default())
        if isinstance(field, models.FileField):
            return value.name if value else ""
        return "" if value is None else str(value)

    def import_csv_view(self, request):
        if not self.has_import_permission(request):
            raise PermissionDenied

        if request.method == "POST":
            form = CSVImportForm(request.POST, request.FILES)
            if form.is_valid():
                created_count, updated_count, errors = self.handle_csv_import(form.cleaned_data["csv_file"])
                if created_count or updated_count:
                    self.message_user(
                        request,
                        f"Imported {created_count} new and updated {updated_count} existing {self.model._meta.verbose_name_plural}.",
                        level=messages.SUCCESS,
                    )
                for error in errors[:10]:
                    self.message_user(request, error, level=messages.ERROR)
                if len(errors) > 10:
                    self.message_user(request, f"{len(errors) - 10} more import errors were omitted.", level=messages.WARNING)
                return HttpResponseRedirect(reverse(
                    f"admin:{self.model._meta.app_label}_{self.model._meta.model_name}_changelist"
                ))
        else:
            form = CSVImportForm()

        context = {
            **self.admin_site.each_context(request),
            "opts": self.model._meta,
            "title": f"Import {self.model._meta.verbose_name_plural} from CSV",
            "form": form,
            "fields": self.get_import_fields(),
            "download_template_url": reverse(
                f"admin:{self.model._meta.app_label}_{self.model._meta.model_name}_template_csv"
            ),
        }
        return render(request, "admin/csv_import.html", context)

    def handle_csv_import(self, uploaded_file):
        created_count = 0
        updated_count = 0
        errors = []

        decoded_file = uploaded_file.read().decode("utf-8-sig")
        reader = csv.DictReader(io.StringIO(decoded_file))
        import_fields = self.get_import_fields()
        id_field = self.get_import_id_field()

        for line_number, row in enumerate(reader, start=2):
            try:
                instance, created = self.prepare_import_instance(row, id_field)
                many_to_many_values = {}

                for field_name in import_fields:
                    if field_name not in row:
                        continue
                    if field_name == id_field and created:
                        continue
                    field = self.model._meta.get_field(field_name)
                    raw_value = row.get(field_name, "")
                    if field.many_to_many:
                        many_to_many_values[field_name] = self.parse_many_to_many_value(field, raw_value)
                        continue
                    parsed_value = self.parse_field_value(field, raw_value)
                    setattr(instance, field_name, parsed_value)

                if isinstance(instance, User) and created and not instance.password:
                    instance.set_unusable_password()

                instance.full_clean()
                instance.save()

                for field_name, related_ids in many_to_many_values.items():
                    getattr(instance, field_name).set(related_ids)

                if created:
                    created_count += 1
                else:
                    updated_count += 1
            except Exception as exc:
                errors.append(f"Row {line_number}: {exc}")

        return created_count, updated_count, errors

    def prepare_import_instance(self, row, id_field):
        identifier = (row.get(id_field) or "").strip()
        if identifier:
            instance = self.model._default_manager.filter(**{id_field: identifier}).first()
            if instance is not None:
                return instance, False
            instance = self.model(**{id_field: identifier})
            return instance, True
        return self.model(), True

    def parse_many_to_many_value(self, field, raw_value):
        if not raw_value.strip():
            return []
        values = self.parse_json_or_csv_list(raw_value)
        related_model = field.remote_field.model
        return list(related_model._default_manager.filter(pk__in=values))

    def parse_field_value(self, field, raw_value):
        raw_value = (raw_value or "").strip()

        if isinstance(field, models.FileField):
            return None if not raw_value else raw_value

        if not raw_value:
            if isinstance(field, models.JSONField):
                return field.get_default()
            if field.null:
                return None
            if getattr(field, "blank", False):
                return ""
            return raw_value

        if field.many_to_one or field.one_to_one:
            related_model = field.remote_field.model
            return related_model._default_manager.get(pk=raw_value)
        if isinstance(field, models.JSONField):
            if raw_value.startswith("{") or raw_value.startswith("["):
                return json.loads(raw_value)
            return self.parse_json_or_csv_list(raw_value)
        if isinstance(field, models.BooleanField):
            normalized = raw_value.lower()
            if normalized in {"1", "true", "yes", "y"}:
                return True
            if normalized in {"0", "false", "no", "n"}:
                return False
            raise ValidationError(f"Invalid boolean value '{raw_value}'")
        if isinstance(field, (models.IntegerField, models.BigIntegerField, models.PositiveIntegerField, models.PositiveSmallIntegerField)):
            return int(raw_value)
        if isinstance(field, (models.FloatField,)):
            return float(raw_value)
        if isinstance(field, models.DecimalField):
            try:
                return Decimal(raw_value)
            except InvalidOperation as exc:
                raise ValidationError(f"Invalid decimal value '{raw_value}'") from exc
        if isinstance(field, models.DateTimeField):
            value = parse_datetime(raw_value)
            if value is None:
                raise ValidationError(f"Invalid datetime value '{raw_value}'")
            return value
        if isinstance(field, models.DateField):
            value = parse_date(raw_value)
            if value is None:
                raise ValidationError(f"Invalid date value '{raw_value}'")
            return value
        return raw_value

    def parse_json_or_csv_list(self, raw_value):
        if raw_value.startswith("["):
            parsed = json.loads(raw_value)
            return parsed if isinstance(parsed, list) else [parsed]
        return [item.strip() for item in raw_value.split(",") if item.strip()]


@admin.action(description="Mark selected accounts as verified")
def mark_users_verified(modeladmin, request, queryset):
    queryset.update(verification_status=VerificationStatus.VERIFIED)


@admin.action(description="Mark selected accounts as pending")
def mark_users_pending(modeladmin, request, queryset):
    queryset.update(verification_status=VerificationStatus.PENDING)


@admin.action(description="Activate selected accounts")
def activate_users(modeladmin, request, queryset):
    queryset.update(is_active=True)


@admin.action(description="Deactivate selected accounts")
def deactivate_users(modeladmin, request, queryset):
    queryset.update(is_active=False)


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


@admin.action(description="Mark selected social accounts as connected")
def connect_social_accounts(modeladmin, request, queryset):
    queryset.update(is_connected=True)


@admin.action(description="Mark selected social accounts as disconnected")
def disconnect_social_accounts(modeladmin, request, queryset):
    queryset.update(is_connected=False)


@admin.action(description="Accept selected applications")
def accept_applications(modeladmin, request, queryset):
    queryset.update(status=ApplicationStatus.ACCEPTED)


@admin.action(description="Reject selected applications")
def reject_applications(modeladmin, request, queryset):
    queryset.update(status=ApplicationStatus.REJECTED)


@admin.action(description="Reset selected applications to applied")
def reset_applications(modeladmin, request, queryset):
    queryset.update(status=ApplicationStatus.APPLIED)


@admin.action(description="Mark selected shortlists as submitted")
def submit_shortlists(modeladmin, request, queryset):
    queryset.update(status=ShortlistStatus.SUBMITTED)


@admin.action(description="Move selected shortlists to draft")
def draft_shortlists(modeladmin, request, queryset):
    queryset.update(status=ShortlistStatus.DRAFT)


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
    actions = ["export_selected_as_csv", mark_users_verified, mark_users_pending, activate_users, deactivate_users]
    export_fields = (
        "user_id",
        "username",
        "email",
        "name",
        "phone_no",
        "role",
        "verification_status",
        "is_staff",
        "is_active",
        "is_profile_visible",
        "created_at",
    )
    import_fields = (
        "user_id",
        "username",
        "email",
        "name",
        "phone_no",
        "role",
        "verification_status",
        "is_staff",
        "is_active",
        "is_profile_visible",
    )
    import_id_field = "user_id"
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
    actions = ["export_selected_as_csv", mark_profiles_verified, mark_profiles_pending, make_profiles_visible, hide_profiles]
    export_fields = (
        "brand_id",
        "user",
        "company_name",
        "industry",
        "website",
        "company_size",
        "linkedin_url",
        "created_at",
        "updated_at",
    )
    import_fields = (
        "brand_id",
        "user",
        "company_name",
        "industry",
        "website",
        "company_size",
        "linkedin_url",
    )
    import_id_field = "brand_id"
    fieldsets = (
        ("Brand Identity", {"classes": ("wide", "collune-section"), "fields": (("company_name", "industry"), ("logo", "website"), ("company_size", "linkedin_url"))}),
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
    actions = ["export_selected_as_csv", mark_profiles_verified, mark_profiles_pending, make_profiles_visible, hide_profiles]
    export_fields = (
        "creator_id",
        "user",
        "display_name",
        "category",
        "location",
        "country",
        "state",
        "district",
        "city",
        "postal_code",
        "street_address",
        "languages",
        "collaboration_preferences",
        "bio",
        "about",
        "gender",
        "profile_completion",
        "work_with",
        "created_at",
        "updated_at",
    )
    import_fields = (
        "creator_id",
        "user",
        "display_name",
        "category",
        "location",
        "country",
        "state",
        "district",
        "city",
        "postal_code",
        "street_address",
        "languages",
        "collaboration_preferences",
        "bio",
        "about",
        "gender",
        "profile_completion",
        "work_with",
    )
    import_id_field = "creator_id"
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
    actions = ["export_selected_as_csv", connect_social_accounts, disconnect_social_accounts]
    export_fields = (
        "account_id",
        "creator",
        "platform",
        "social_id",
        "username",
        "handle",
        "url",
        "followers",
        "media_count",
        "view_count",
        "engagement_rate",
        "video_count",
        "videos",
        "analytics",
        "provider_data",
        "expires_at",
        "is_connected",
        "last_synced_at",
        "created_at",
    )
    import_fields = (
        "account_id",
        "creator",
        "platform",
        "social_id",
        "username",
        "handle",
        "url",
        "followers",
        "media_count",
        "view_count",
        "engagement_rate",
        "video_count",
        "videos",
        "analytics",
        "provider_data",
        "expires_at",
        "is_connected",
        "last_synced_at",
    )
    import_id_field = "account_id"


@admin.register(Campaign)
class CampaignAdmin(ColluneAdminMixin, admin.ModelAdmin):
    list_display = ("title", "brand", "category", "audience_type", "deadline", "created_at")
    search_fields = ("title", "brand__company_name", "category", "audience_type")
    list_filter = ("category", "audience_type", "compensation_type", "deadline", "created_at")
    autocomplete_fields = ("brand",)
    date_hierarchy = "created_at"
    readonly_fields = ("created_at", "updated_at")
    actions = ["export_selected_as_csv"]
    export_fields = (
        "campaign_id",
        "brand",
        "title",
        "internal_reference_name",
        "brief",
        "objective",
        "deliverables",
        "brand_requirements",
        "creative_direction",
        "tone_of_communication",
        "content_references",
        "platforms",
        "category",
        "audience_type",
        "location",
        "minimum_followers",
        "language_preference",
        "content_style",
        "additional_preferences",
        "total_budget",
        "budget_range",
        "compensation_type",
        "deliverable_pricing",
        "start_date",
        "end_date",
        "deadline",
        "created_at",
        "updated_at",
    )
    import_fields = export_fields[:-2]
    import_id_field = "campaign_id"
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
    actions = ["export_selected_as_csv", accept_applications, reject_applications, reset_applications]
    export_fields = (
        "application_id",
        "campaign",
        "creator",
        "pitch",
        "quoted_rate",
        "status",
        "created_at",
        "updated_at",
    )
    import_fields = (
        "application_id",
        "campaign",
        "creator",
        "pitch",
        "quoted_rate",
        "status",
    )
    import_id_field = "application_id"


@admin.register(BrandShortlist)
class BrandShortlistAdmin(ColluneAdminMixin, admin.ModelAdmin):
    list_display = ("title", "brand", "status", "creator_total", "created_at", "updated_at")
    search_fields = ("title", "brand__company_name", "creators__display_name")
    list_filter = ("status", "created_at", "updated_at")
    autocomplete_fields = ("brand",)
    filter_horizontal = ("creators",)
    readonly_fields = ("created_at", "updated_at")
    actions = ["export_selected_as_csv", submit_shortlists, draft_shortlists]
    export_fields = (
        "shortlist_id",
        "brand",
        "title",
        "creators",
        "status",
        "purpose",
        "notes",
        "platforms",
        "categories",
        "audience",
        "budget_range",
        "start_date",
        "end_date",
        "created_at",
        "updated_at",
    )
    import_fields = export_fields[:-2]
    import_id_field = "shortlist_id"
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
    actions = ["export_selected_as_csv"]
    export_fields = ("role_id", "user", "role_name", "permissions", "Purpose")
    import_fields = export_fields
    import_id_field = "role_id"
