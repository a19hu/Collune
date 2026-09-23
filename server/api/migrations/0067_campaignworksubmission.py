# Generated manually because the local environment does not include Django.

import uuid

from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0066_alter_adminpermission_module"),
    ]

    operations = [
        migrations.CreateModel(
            name="CampaignWorkSubmission",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("platform", models.CharField(max_length=32)),
                ("content_type", models.CharField(max_length=150)),
                ("content_title", models.CharField(blank=True, default="", max_length=255)),
                ("content_url", models.URLField(max_length=2048)),
                ("published_date", models.DateField(blank=True, null=True)),
                ("description", models.TextField(blank=True, default="")),
                ("creator_remarks", models.TextField(blank=True, default="")),
                ("screenshot_url", models.URLField(blank=True, default="", max_length=2048)),
                ("attachment_url", models.URLField(blank=True, default="", max_length=2048)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("SUBMITTED", "Submitted"),
                            ("UNDER_REVIEW", "Under review"),
                            ("REVISION_REQUESTED", "Revision requested"),
                            ("APPROVED", "Approved"),
                            ("COMPLETED", "Completed"),
                        ],
                        default="SUBMITTED",
                        max_length=24,
                    ),
                ),
                ("brand_comment", models.TextField(blank=True, default="")),
                ("submitted_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("approved_at", models.DateTimeField(blank=True, null=True)),
                ("completed_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "brand",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="work_submissions",
                        to="api.brandprofile",
                    ),
                ),
                (
                    "campaign",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="work_submissions",
                        to="api.campaign",
                    ),
                ),
                (
                    "creator",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="work_submissions",
                        to="api.creatorprofile",
                    ),
                ),
            ],
            options={
                "db_table": "campaign_work_submissions",
                "ordering": ("-submitted_at",),
            },
        ),
    ]
