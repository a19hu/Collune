from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("api", "0072_backfill_youtube_engagement_rates")]

    operations = [
        migrations.AddField(
            model_name="brandprofile",
            name="headquarters_district",
            field=models.CharField(blank=True, default="", max_length=120),
        ),
    ]
