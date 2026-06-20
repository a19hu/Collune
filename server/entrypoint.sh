#!/bin/sh
set -e

python manage.py migrate --noinput

python manage.py ensure_superuser

exec gunicorn server.wsgi:application --bind 0.0.0.0:$PORT
