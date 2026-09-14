import os
import ssl
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
    # Kombu requires explicit TLS settings for rediss:// URLs. Keep these
    # separate from REDIS_URL because channels-redis uses redis-py's URL
    # parser, whose ssl_cert_reqs URL values differ from Kombu's.
    broker_use_ssl={"ssl_cert_reqs": ssl.CERT_REQUIRED},
    redis_backend_use_ssl={"ssl_cert_reqs": ssl.CERT_REQUIRED},
    timezone="UTC",
    imports=("api.message_queue.tasks",),
)
