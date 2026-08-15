from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0037_alter_creatorprofile_location"),
    ]

    operations = [
        migrations.AddField(
            model_name="creatorprofile",
            name="city",
            field=models.CharField(blank=True, default="", max_length=120),
        ),
        migrations.AddField(
            model_name="creatorprofile",
            name="country",
            field=models.CharField(blank=True, default="", max_length=120),
        ),
        migrations.AddField(
            model_name="creatorprofile",
            name="district",
            field=models.CharField(blank=True, default="", max_length=120),
        ),
        migrations.AddField(
            model_name="creatorprofile",
            name="postal_code",
            field=models.CharField(blank=True, default="", max_length=32),
        ),
        migrations.AddField(
            model_name="creatorprofile",
            name="state",
            field=models.CharField(blank=True, default="", max_length=120),
        ),
        migrations.AddField(
            model_name="creatorprofile",
            name="street_address",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
    ]
