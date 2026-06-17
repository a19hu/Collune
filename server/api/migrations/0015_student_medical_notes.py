from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0014_remove_inquiry_board_preference"),
    ]

    operations = [
        migrations.AddField(
            model_name="student",
            name="medical_notes",
            field=models.TextField(blank=True, default=""),
        ),
    ]
