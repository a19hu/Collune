#!/bin/sh
# Cloud Run services must listen on $PORT.  The small HTTP server below fulfils
# that platform requirement while Celery does the actual background work.
set -u

celery -A api.message_queue worker -l info &
celery_pid=$!

python -m http.server "${PORT:-8080}" --bind 0.0.0.0 --directory /tmp &
health_server_pid=$!

shutdown() {
  kill -TERM "$celery_pid" "$health_server_pid" 2>/dev/null || true
  wait "$celery_pid" 2>/dev/null || true
  wait "$health_server_pid" 2>/dev/null || true
  exit 0
}

trap shutdown INT TERM

# A failed worker should cause the Cloud Run instance to restart instead of
# leaving a healthy HTTP process running with no consumer.
wait "$celery_pid"
worker_status=$?
kill -TERM "$health_server_pid" 2>/dev/null || true
wait "$health_server_pid" 2>/dev/null || true
exit "$worker_status"
