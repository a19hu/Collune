#!/bin/sh
set -e

python manage.py makemigrations

python manage.py migrate

python manage.py ensure_superuser

exec gunicorn server.wsgi:application --bind 0.0.0.0:8080
