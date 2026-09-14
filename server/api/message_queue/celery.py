import os
from pathlib import Path

from celery import Celery
import environ

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "server.settings")

env = environ.Env()
env.read_env(Path(__file__).resolve().parents[2] / ".env")

app = Celery("collune_message_queue")
app.conf.update(
    broker_url=env("CELERY_BROKER_URL", default=env("REDIS_URL", default="redis://localhost:6379/0")),
    result_backend=env(
        "CELERY_RESULT_BACKEND",
        default=env("REDIS_URL", default="redis://localhost:6379/0"),
    ),
    timezone="UTC",
    imports=("api.message_queue.tasks",),
)
