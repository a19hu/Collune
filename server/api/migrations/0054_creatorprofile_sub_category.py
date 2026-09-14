from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("api", "0053_chatmessage_edit_delete")]

    operations = [
        migrations.AddField(
            model_name="creatorprofile",
            name="sub_category",
            field=models.CharField(blank=True, default="", max_length=120),
        ),
    ]
