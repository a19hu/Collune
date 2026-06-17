from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0012_inquiry_extended_fields"),
    ]

    operations = [
        migrations.AlterField(
            model_name="inquiry",
            name="status",
            field=models.CharField(
                choices=[
                    ("INQUIRY", "INQUIRY"),
                    ("INTERESTED", "INTERESTED"),
                    ("INQUIRY_CONVERTED", "INQUIRY_CONVERTED"),
                    ("REGISTERED", "REGISTERED"),
                    ("ADMISSION_REJECTED", "ADMISSION_REJECTED"),
                    ("CANCELLED", "CANCELLED"),
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
                    ("INTERESTED", "INTERESTED"),
                    ("INQUIRY_CONVERTED", "INQUIRY_CONVERTED"),
                    ("REGISTERED", "REGISTERED"),
                    ("ADMISSION_REJECTED", "ADMISSION_REJECTED"),
                    ("CANCELLED", "CANCELLED"),
                ],
                default="REGISTERED",
                max_length=32,
            ),
        ),
    ]
