import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "server.settings")

app = Celery("collune_message_queue")
app.conf.update(
    broker_url=os.getenv("CELERY_BROKER_URL") or os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    result_backend=os.getenv("CELERY_RESULT_BACKEND") or os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    timezone="UTC",
    imports=("api.message_queue.tasks",),
)
