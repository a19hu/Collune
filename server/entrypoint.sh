#!/bin/sh
set -e

python manage.py migrate --noinput
python manage.py collectstatic --noinput
python manage.py ensure_superuser

exec uvicorn server.asgi:application --host 0.0.0.0 --port ${PORT:-8080}
