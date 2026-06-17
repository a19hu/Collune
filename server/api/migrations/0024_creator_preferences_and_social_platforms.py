from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0023_otpverification"),
    ]

    operations = [
        migrations.AddField(
            model_name="creatorprofile",
            name="collaboration_preferences",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="creatorprofile",
            name="open_to_travel",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="creatorprofile",
            name="preferred_response_time",
            field=models.CharField(blank=True, default="", max_length=80),
        ),
        migrations.AlterField(
            model_name="creatorsocialaccount",
            name="platform",
            field=models.CharField(
                choices=[
                    ("INSTAGRAM", "Instagram"),
                    ("YOUTUBE", "YouTube"),
                    ("LINKEDIN", "LinkedIn"),
                    ("X", "X"),
                    ("FACEBOOK", "Facebook"),
                    ("TIKTOK", "TikTok"),
                    ("SNAPCHAT", "Snapchat"),
                    ("PINTEREST", "Pinterest"),
                    ("THREADS", "Threads"),
                    ("WEBSITE", "Website"),
                ],
                max_length=24,
            ),
        ),
    ]
