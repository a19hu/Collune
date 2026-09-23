# Generated manually to preserve existing creator pricing amounts.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0064_simplify_rate_cards"),
    ]

    operations = [
        migrations.RenameField(
            model_name="creatorsocialmediapricing",
            old_name="social_media_pricing",
            new_name="price",
        ),
        migrations.RemoveField(
            model_name="creatorsocialmediapricing",
            name="social_media_name",
        ),
        migrations.AddField(
            model_name="creatorsocialmediapricing",
            name="platform",
            field=models.CharField(default="", max_length=32),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="creatorsocialmediapricing",
            name="service",
            field=models.CharField(default="", max_length=150),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="creatorsocialmediapricing",
            name="pricing_type",
            field=models.CharField(
                choices=[
                    ("FIXED_PRICE", "Fixed Price"),
                    ("STARTING_FROM", "Starting From"),
                    ("NEGOTIABLE", "Negotiable"),
                ],
                default="FIXED_PRICE",
                max_length=50,
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="creatorsocialmediapricing",
            name="notes",
            field=models.CharField(default="", max_length=30),
            preserve_default=False,
        ),
    ]
