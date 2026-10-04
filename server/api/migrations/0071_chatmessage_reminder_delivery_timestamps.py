from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("api", "0070_remove_chatmessage_email_reminded_at")]

    operations = [
        migrations.AddField(
            model_name="chatmessage",
            name="reminder_email_sent_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="chatmessage",
            name="reminder_whatsapp_sent_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
