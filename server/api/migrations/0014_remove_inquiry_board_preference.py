from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0013_add_interested_admission_status"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="inquiry",
            name="board_preference",
        ),
    ]
