import os
import ssl
from pathlib import Path

from celery import Celery
import environ

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "server.settings")

env = environ.Env()
env.read_env(Path(__file__).resolve().parents[2] / ".env")

app = Celery("collune_message_queue")
broker_url = env(
    "CELERY_BROKER_URL",
    default=env("REDIS_URL", default="redis://localhost:6379/0"),
)
result_backend = env(
    "CELERY_RESULT_BACKEND",
    default=env("REDIS_URL", default="redis://localhost:6379/0"),
)

celery_config = {
    "broker_url": broker_url,
    "result_backend": result_backend,
    "timezone": "UTC",
    "imports": ("api.message_queue.tasks",),
}

# Kombu needs TLS options for rediss:// connections. Do not set them for a
# regular redis:// URL: that would make local non-TLS Redis unusable.
if broker_url.startswith("rediss://"):
    celery_config["broker_use_ssl"] = {"ssl_cert_reqs": ssl.CERT_REQUIRED}
if result_backend.startswith("rediss://"):
    celery_config["redis_backend_use_ssl"] = {"ssl_cert_reqs": ssl.CERT_REQUIRED}

app.conf.update(**celery_config)
