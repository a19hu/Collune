from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [("api", "0057_remove_creator_profile_fields")]

    operations = [
        migrations.DeleteModel(name="CreatorCampaignInvitation"),
    ]
