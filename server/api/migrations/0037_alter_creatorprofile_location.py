from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0036_alter_user_role_useradminrole"),
    ]

    operations = [
        migrations.AlterField(
            model_name="creatorprofile",
            name="location",
            field=models.CharField(blank=True, default="", max_length=500),
        ),
    ]
