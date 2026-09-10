from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [("api", "0056_creator_card_and_invitations")]

    operations = [
        migrations.RemoveField(model_name="creatorprofile", name="sub_category"),
        migrations.RemoveField(model_name="creatorprofile", name="starting_price"),
        migrations.RemoveField(model_name="creatorprofile", name="average_reach"),
        migrations.RemoveField(model_name="creatorprofile", name="availability"),
        migrations.RemoveField(model_name="creatorprofile", name="rating"),
    ]
