from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("api", "0058_delete_creatorcampaigninvitation")]

    operations = [
        migrations.AddField(
            model_name="chatmessage",
            name="email_reminded_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
