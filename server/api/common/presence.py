"""Lightweight online/offline presence tracking.

Uses Redis (shared across gunicorn/uvicorn workers) when REDIS_URL is
configured, falling back to an in-process store for local development.
"""
from django.conf import settings
from django.utils import timezone

try:
    import redis
except ImportError:
    redis = None

_ONLINE_KEY = "presence:online:{user_id}"
_LAST_SEEN_KEY = "presence:last_seen:{user_id}"
_PRESENCE_TTL = 120

# Fallback store, only correct for a single-process dev server.
_local_connections: dict[str, set] = {}
_local_last_seen: dict[str, str] = {}


def _redis_client():
    if not redis or not getattr(settings, "REDIS_URL", ""):
        return None
    client = getattr(_redis_client, "_client", None)
    if client is None:
        client = redis.from_url(settings.REDIS_URL)
        _redis_client._client = client
    return client


def mark_online(user_id, channel_name):
    """Register a connection for user_id. Returns True if they just came online."""
    user_id = str(user_id)
    client = _redis_client()
    if client:
        key = _ONLINE_KEY.format(user_id=user_id)
        was_online = bool(client.exists(key))
        client.sadd(key, channel_name)
        client.expire(key, _PRESENCE_TTL)
        return not was_online

    connections = _local_connections.setdefault(user_id, set())
    was_online = bool(connections)
    connections.add(channel_name)
    return not was_online


def mark_offline(user_id, channel_name):
    """Remove a connection for user_id. Returns True if they just went offline."""
    user_id = str(user_id)
    client = _redis_client()
    if client:
        key = _ONLINE_KEY.format(user_id=user_id)
        client.srem(key, channel_name)
        if client.scard(key) == 0:
            client.delete(key)
            client.set(_LAST_SEEN_KEY.format(user_id=user_id), timezone.now().isoformat())
            return True
        return False

    connections = _local_connections.get(user_id)
    if not connections:
        return True
    connections.discard(channel_name)
    if not connections:
        _local_connections.pop(user_id, None)
        _local_last_seen[user_id] = timezone.now().isoformat()
        return True
    return False


def is_online(user_id):
    user_id = str(user_id)
    client = _redis_client()
    if client:
        return bool(client.exists(_ONLINE_KEY.format(user_id=user_id)))
    return bool(_local_connections.get(user_id))


def get_last_seen(user_id):
    user_id = str(user_id)
    client = _redis_client()
    if client:
        value = client.get(_LAST_SEEN_KEY.format(user_id=user_id))
        return value.decode() if value else None
    return _local_last_seen.get(user_id)
