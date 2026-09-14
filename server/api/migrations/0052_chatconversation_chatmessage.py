import django.db.models.deletion
import django.utils.timezone
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0051_notification"),
    ]

    operations = [
        migrations.CreateModel(
            name="ChatConversation",
            fields=[
                ("conversation_id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("brand", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="chat_conversations", to="api.brandprofile")),
                ("creator", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="chat_conversations", to="api.creatorprofile")),
            ],
            options={"ordering": ("-updated_at", "-created_at"), "unique_together": {("brand", "creator")}},
        ),
        migrations.CreateModel(
            name="ChatMessage",
            fields=[
                ("message_id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("content", models.TextField()),
                ("is_read", models.BooleanField(db_index=True, default=False)),
                ("read_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(db_index=True, default=django.utils.timezone.now)),
                ("conversation", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="messages", to="api.chatconversation")),
                ("sender", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="chat_messages", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ("created_at",)},
        ),
    ]
