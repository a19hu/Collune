from django.db import migrations


def backfill_youtube_engagement_rates(apps, schema_editor):
    CreatorSocialAccount = apps.get_model("api", "CreatorSocialAccount")
    for account in CreatorSocialAccount.objects.filter(platform="YOUTUBE").iterator():
        videos = account.videos or []
        followers = account.followers or 0
        if not videos or followers <= 0:
            continue

        interactions = sum(
            int(video.get("like_count") or 0)
            + int(video.get("comment_count") or 0)
            + int(video.get("share_count") or 0)
            for video in videos
        )
        engagement_rate = round((interactions / (followers * len(videos))) * 100, 2)
        if account.engagement_rate != engagement_rate:
            account.engagement_rate = engagement_rate
            account.save(update_fields=["engagement_rate"])


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0071_chatmessage_reminder_delivery_timestamps"),
    ]

    operations = [
        migrations.RunPython(backfill_youtube_engagement_rates, migrations.RunPython.noop),
    ]
