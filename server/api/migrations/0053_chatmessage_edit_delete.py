from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("api", "0052_chatconversation_chatmessage")]

    operations = [
        migrations.AddField(
            model_name="chatmessage",
            name="edited_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="chatmessage",
            name="deleted_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
