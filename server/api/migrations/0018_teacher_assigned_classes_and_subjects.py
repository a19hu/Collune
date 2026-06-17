from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0017_school_school_type"),
    ]

    operations = [
        migrations.AddField(
            model_name="teacher",
            name="assigned_classes",
            field=models.ManyToManyField(blank=True, related_name="teachers", to="api.class"),
        ),
        migrations.AddField(
            model_name="teacher",
            name="assigned_subjects",
            field=models.ManyToManyField(blank=True, related_name="teachers", to="api.subject"),
        ),
    ]
