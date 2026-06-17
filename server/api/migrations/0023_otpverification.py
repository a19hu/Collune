import uuid

import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0022_alter_user_options"),
    ]

    operations = [
        migrations.CreateModel(
            name="OtpVerification",
            fields=[
                ("otp_id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("channel", models.CharField(choices=[("EMAIL", "Email"), ("PHONE", "Phone")], max_length=16)),
                ("target", models.CharField(db_index=True, max_length=255)),
                ("code", models.CharField(max_length=6)),
                ("purpose", models.CharField(default="creator_registration", max_length=64)),
                ("is_verified", models.BooleanField(default=False)),
                ("attempts", models.PositiveSmallIntegerField(default=0)),
                ("expires_at", models.DateTimeField()),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("verified_at", models.DateTimeField(blank=True, null=True)),
            ],
            options={"ordering": ("-created_at",)},
        ),
    ]
