import uuid
import django.db.models.deletion
import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("api", "0055_creator_discovery_sort_metrics")]

    operations = [
        migrations.AddField(model_name="creatorprofile", name="average_reach", field=models.PositiveIntegerField(null=True, blank=True)),
        migrations.AddField(model_name="creatorprofile", name="availability", field=models.CharField(max_length=24, choices=[("AVAILABLE", "Available"), ("BUSY", "Busy"), ("UNAVAILABLE", "Unavailable")], blank=True, default="")),
        migrations.CreateModel(
            name="CreatorCampaignInvitation",
            fields=[
                ("invitation_id", models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, serialize=False)),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("campaign", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="creator_invitations", to="api.campaign")),
                ("creator", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="campaign_invitations", to="api.creatorprofile")),
            ],
            options={"unique_together": {("campaign", "creator")}},
        ),
    ]
