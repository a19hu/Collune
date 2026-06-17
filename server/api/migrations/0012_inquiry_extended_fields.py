from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0011_studentattendance_staffattendance"),
    ]

    operations = [
        migrations.AddField(
            model_name="inquiry",
            name="academic_session",
            field=models.CharField(blank=True, default="", max_length=32),
        ),
        migrations.AddField(
            model_name="inquiry",
            name="board_preference",
            field=models.CharField(blank=True, default="", max_length=32),
        ),
        migrations.AddField(
            model_name="inquiry",
            name="current_class",
            field=models.CharField(blank=True, default="", max_length=100),
        ),
        migrations.AddField(
            model_name="inquiry",
            name="current_school",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="inquiry",
            name="dob",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="inquiry",
            name="gender",
            field=models.CharField(blank=True, choices=[("MALE", "MALE"), ("FEMALE", "FEMALE"), ("OTHER", "OTHER")], max_length=16, null=True),
        ),
        migrations.AddField(
            model_name="inquiry",
            name="guardian_name",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="inquiry",
            name="inquiry_source",
            field=models.CharField(blank=True, default="", max_length=64),
        ),
        migrations.AddField(
            model_name="inquiry",
            name="mother_name",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
    ]
