from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0031_brandshortlist_metadata_and_creators"),
    ]

    operations = [
        migrations.AddField(
            model_name="creatorsocialaccount",
            name="youtube_short_video_count",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="creatorsocialaccount",
            name="youtube_long_video_count",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="creatorsocialaccount",
            name="youtube_videos",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="creatorsocialaccount",
            name="youtube_analytics",
            field=models.JSONField(blank=True, default=dict),
        ),
    ]
