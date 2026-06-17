import uuid

import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0020_remove_school_campus_type"),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name="user",
            name="uniq_user_email_per_school",
        ),
        migrations.RemoveConstraint(
            model_name="user",
            name="uniq_user_phone_per_school",
        ),
        migrations.RemoveField(
            model_name="user",
            name="school",
        ),
        migrations.AlterField(
            model_name="user",
            name="role",
            field=models.CharField(
                choices=[("ADMIN", "Admin"), ("BRAND", "Brand"), ("CREATOR", "Creator")],
                default="CREATOR",
                max_length=32,
            ),
        ),
        migrations.AlterField(
            model_name="user",
            name="created_at",
            field=models.DateTimeField(default=django.utils.timezone.now),
        ),
        migrations.DeleteModel(name="StaffAttendance"),
        migrations.DeleteModel(name="StaffSalaryPayment"),
        migrations.DeleteModel(name="StaffAddress"),
        migrations.DeleteModel(name="WorkdayAttendance"),
        migrations.DeleteModel(name="StudentAttendance"),
        migrations.DeleteModel(name="StudentMark"),
        migrations.DeleteModel(name="ExamTimetable"),
        migrations.DeleteModel(name="Exam"),
        migrations.DeleteModel(name="Class"),
        migrations.DeleteModel(name="Subject"),
        migrations.DeleteModel(name="SalaryPayment"),
        migrations.DeleteModel(name="TeacherAddress"),
        migrations.DeleteModel(name="Staff"),
        migrations.DeleteModel(name="Teacher"),
        migrations.DeleteModel(name="StudentFeePayment"),
        migrations.DeleteModel(name="FeeAccount"),
        migrations.DeleteModel(name="ClassEnrollment"),
        migrations.DeleteModel(name="Document"),
        migrations.DeleteModel(name="GuardianInfo"),
        migrations.DeleteModel(name="StudentAddress"),
        migrations.DeleteModel(name="StudentAdmission"),
        migrations.DeleteModel(name="Student"),
        migrations.DeleteModel(name="Inquiry"),
        migrations.DeleteModel(name="SchoolDomain"),
        migrations.DeleteModel(name="SchoolAddress"),
        migrations.DeleteModel(name="SchoolPrincipal"),
        migrations.DeleteModel(name="School"),
        migrations.CreateModel(
            name="BrandProfile",
            fields=[
                ("brand_id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("company_name", models.CharField(max_length=255)),
                ("industry", models.CharField(blank=True, default="", max_length=120)),
                ("website", models.URLField(blank=True, default="")),
                ("company_size", models.CharField(blank=True, default="", max_length=64)),
                ("linkedin_url", models.URLField(blank=True, default="")),
                ("logo", models.ImageField(blank=True, null=True, upload_to="brands/logos/")),
                (
                    "verification_status",
                    models.CharField(
                        choices=[
                            ("DRAFT", "Draft"),
                            ("PENDING", "Pending review"),
                            ("VERIFIED", "Verified"),
                            ("REJECTED", "Rejected"),
                        ],
                        default="PENDING",
                        max_length=24,
                    ),
                ),
                ("profile_completion", models.PositiveSmallIntegerField(default=90)),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="brand_profile",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="CreatorProfile",
            fields=[
                ("creator_id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("display_name", models.CharField(max_length=255)),
                ("category", models.CharField(blank=True, default="", max_length=120)),
                ("location", models.CharField(blank=True, default="", max_length=160)),
                ("languages", models.JSONField(blank=True, default=list)),
                ("bio", models.TextField(blank=True, default="")),
                ("portfolio_url", models.URLField(blank=True, default="")),
                ("profile_image", models.ImageField(blank=True, null=True, upload_to="creators/profiles/")),
                ("audience_size", models.PositiveIntegerField(default=0)),
                ("rate_min", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("rate_max", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                (
                    "verification_status",
                    models.CharField(
                        choices=[
                            ("DRAFT", "Draft"),
                            ("PENDING", "Pending review"),
                            ("VERIFIED", "Verified"),
                            ("REJECTED", "Rejected"),
                        ],
                        default="PENDING",
                        max_length=24,
                    ),
                ),
                ("profile_completion", models.PositiveSmallIntegerField(default=85)),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="creator_profile",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Campaign",
            fields=[
                ("campaign_id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("title", models.CharField(max_length=255)),
                ("brief", models.TextField()),
                ("category", models.CharField(blank=True, default="", max_length=120)),
                ("budget_min", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("budget_max", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("deadline", models.DateField(blank=True, null=True)),
                ("cover_image", models.URLField(blank=True, default="")),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("DRAFT", "Draft"),
                            ("ACTIVE", "Active"),
                            ("REVIEWING", "Reviewing"),
                            ("PAUSED", "Paused"),
                            ("COMPLETED", "Completed"),
                        ],
                        default="DRAFT",
                        max_length=24,
                    ),
                ),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "brand",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="campaigns", to="api.brandprofile"),
                ),
            ],
            options={"ordering": ("-created_at",)},
        ),
        migrations.CreateModel(
            name="CreatorSocialAccount",
            fields=[
                ("account_id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                (
                    "platform",
                    models.CharField(
                        choices=[
                            ("INSTAGRAM", "Instagram"),
                            ("YOUTUBE", "YouTube"),
                            ("LINKEDIN", "LinkedIn"),
                            ("X", "X"),
                            ("WEBSITE", "Website"),
                        ],
                        max_length=24,
                    ),
                ),
                ("handle", models.CharField(max_length=120)),
                ("url", models.URLField(blank=True, default="")),
                ("followers", models.PositiveIntegerField(default=0)),
                ("is_connected", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                (
                    "creator",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="social_accounts",
                        to="api.creatorprofile",
                    ),
                ),
            ],
            options={"unique_together": {("creator", "platform", "handle")}},
        ),
        migrations.CreateModel(
            name="CampaignApplication",
            fields=[
                ("application_id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("pitch", models.TextField(blank=True, default="")),
                ("quoted_rate", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("APPLIED", "Applied"),
                            ("SHORTLISTED", "Shortlisted"),
                            ("ACCEPTED", "Accepted"),
                            ("REJECTED", "Rejected"),
                        ],
                        default="APPLIED",
                        max_length=24,
                    ),
                ),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "campaign",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="applications",
                        to="api.campaign",
                    ),
                ),
                (
                    "creator",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="applications",
                        to="api.creatorprofile",
                    ),
                ),
            ],
            options={"ordering": ("-created_at",), "unique_together": {("campaign", "creator")}},
        ),
        migrations.CreateModel(
            name="BrandShortlist",
            fields=[
                ("shortlist_id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("notes", models.TextField(blank=True, default="")),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                (
                    "brand",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="shortlists", to="api.brandprofile"),
                ),
                (
                    "creator",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="shortlisted_by",
                        to="api.creatorprofile",
                    ),
                ),
            ],
            options={"ordering": ("-created_at",), "unique_together": {("brand", "creator")}},
        ),
    ]
