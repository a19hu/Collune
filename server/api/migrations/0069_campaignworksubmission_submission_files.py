# Generated manually because the local environment does not include Django.

from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0068_alter_campaignworksubmission_options_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="campaignworksubmission",
            name="attachment_url",
            field=models.FileField(blank=True, null=True, upload_to="Creator/Campain/work-delivery/attachments"),
        ),
        migrations.AddField(
            model_name="campaignworksubmission",
            name="approved_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="campaignworksubmission",
            name="completed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="campaignworksubmission",
            name="creator_remarks",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="campaignworksubmission",
            name="submitted_at",
            field=models.DateTimeField(default=django.utils.timezone.now),
        ),
    ]
