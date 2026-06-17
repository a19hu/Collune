from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0016_alter_inquiry_status_alter_studentadmission_status"),
    ]

    operations = [
        migrations.AddField(
            model_name="school",
            name="school_type",
            field=models.CharField(
                choices=[
                    ("PRESCHOOL", "Pre-School"),
                    ("PRIMARY", "Primary School"),
                    ("MIDDLE", "Middle School"),
                    ("SECONDARY", "Secondary School"),
                    ("SENIOR_SECONDARY", "Senior Secondary School"),
                    ("ELEMENTARY", "Elementary School"),
                    ("HIGH_SCHOOL", "High School"),
                    ("K12", "K-12 School"),
                    ("JUNIOR_COLLEGE", "Junior College"),
                ],
                default="K12",
                max_length=32,
            ),
        ),
    ]
