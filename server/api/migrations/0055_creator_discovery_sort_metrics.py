from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("api", "0054_creatorprofile_sub_category")]

    operations = [
        migrations.AddField(model_name="creatorprofile", name="starting_price", field=models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)),
        migrations.AddField(model_name="creatorprofile", name="rating", field=models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)),
    ]
