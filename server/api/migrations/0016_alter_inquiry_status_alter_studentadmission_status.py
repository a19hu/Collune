from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0015_student_medical_notes"),
    ]

    operations = [
        migrations.AlterField(
            model_name="inquiry",
            name="status",
            field=models.CharField(
                choices=[
                    ("INQUIRY", "INQUIRY"),
                    ("REGISTERED", "REGISTERED"),
                    ("ADMISSION_REJECTED", "ADMISSION_REJECTED"),
                ],
                default="INQUIRY",
                max_length=32,
            ),
        ),
        migrations.AlterField(
            model_name="studentadmission",
            name="status",
            field=models.CharField(
                choices=[
                    ("INQUIRY", "INQUIRY"),
                    ("REGISTERED", "REGISTERED"),
                    ("ADMISSION_REJECTED", "ADMISSION_REJECTED"),
                ],
                default="REGISTERED",
                max_length=32,
            ),
        ),
    ]
