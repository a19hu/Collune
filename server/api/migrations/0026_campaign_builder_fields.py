from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0025_remove_creatorsocialaccount_followers_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="campaign",
            name="additional_preferences",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="campaign",
            name="audience_type",
            field=models.CharField(blank=True, default="", max_length=120),
        ),
        migrations.AddField(
            model_name="campaign",
            name="brand_guidelines",
            field=models.FileField(blank=True, null=True, upload_to="campaigns/guidelines/"),
        ),
        migrations.AddField(
            model_name="campaign",
            name="brand_requirements",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="campaign",
            name="budget_range",
            field=models.CharField(blank=True, default="", max_length=80),
        ),
        migrations.AddField(
            model_name="campaign",
            name="compensation_type",
            field=models.CharField(blank=True, default="", max_length=80),
        ),
        migrations.AddField(
            model_name="campaign",
            name="content_references",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="campaign",
            name="content_style",
            field=models.CharField(blank=True, default="", max_length=120),
        ),
        migrations.AddField(
            model_name="campaign",
            name="creative_direction",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="campaign",
            name="deliverable_pricing",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name="campaign",
            name="deliverables",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="campaign",
            name="end_date",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="campaign",
            name="internal_reference_name",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="campaign",
            name="language_preference",
            field=models.CharField(blank=True, default="", max_length=80),
        ),
        migrations.AddField(
            model_name="campaign",
            name="location",
            field=models.CharField(blank=True, default="", max_length=160),
        ),
        migrations.AddField(
            model_name="campaign",
            name="minimum_followers",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="campaign",
            name="objective",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="campaign",
            name="platforms",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="campaign",
            name="start_date",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="campaign",
            name="tone_of_communication",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="campaign",
            name="total_budget",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
    ]
