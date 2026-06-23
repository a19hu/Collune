import django.utils.timezone
from django.db import migrations, models


def copy_existing_shortlist_creators(apps, schema_editor):
    BrandShortlist = apps.get_model("api", "BrandShortlist")
    for shortlist in BrandShortlist.objects.exclude(creator_id__isnull=True):
        shortlist.creators.add(shortlist.creator_id)


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0030_creatorsocialaccount_provider_data_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="brandshortlist",
            name="title",
            field=models.CharField(default="Untitled Shortlist", max_length=160),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="brandshortlist",
            name="status",
            field=models.CharField(
                choices=[
                    ("DRAFT", "Draft"),
                    ("SUBMITTED", "Submitted"),
                    ("OUTREACH_IN_PROGRESS", "Outreach In Progress"),
                    ("COMPLETED", "Completed"),
                ],
                default="DRAFT",
                max_length=32,
            ),
        ),
        migrations.AddField(
            model_name="brandshortlist",
            name="purpose",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="brandshortlist",
            name="platforms",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="brandshortlist",
            name="categories",
            field=models.CharField(blank=True, default="", max_length=240),
        ),
        migrations.AddField(
            model_name="brandshortlist",
            name="audience",
            field=models.CharField(blank=True, default="", max_length=240),
        ),
        migrations.AddField(
            model_name="brandshortlist",
            name="budget_range",
            field=models.CharField(blank=True, default="", max_length=120),
        ),
        migrations.AddField(
            model_name="brandshortlist",
            name="timeline",
            field=models.CharField(blank=True, default="", max_length=160),
        ),
        migrations.AddField(
            model_name="brandshortlist",
            name="updated_at",
            field=models.DateTimeField(auto_now=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="brandshortlist",
            name="creators",
            field=models.ManyToManyField(blank=True, related_name="shortlisted_by", to="api.creatorprofile"),
        ),
        migrations.RunPython(copy_existing_shortlist_creators, migrations.RunPython.noop),
        migrations.AlterUniqueTogether(
            name="brandshortlist",
            unique_together=set(),
        ),
        migrations.RemoveField(
            model_name="brandshortlist",
            name="creator",
        ),
        migrations.AlterModelOptions(
            name="brandshortlist",
            options={"ordering": ("-updated_at", "-created_at")},
        ),
    ]
