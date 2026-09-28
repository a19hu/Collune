"""In-process online/offline presence tracking.

Presence is intentionally local to each application process. It is suitable
for a single server instance but is not shared across multiple instances.
"""
from django.utils import timezone

_local_connections: dict[str, set] = {}
_local_last_seen: dict[str, str] = {}

def mark_online(user_id, channel_name):
    """Register a connection for user_id. Returns True if they just came online."""
    user_id = str(user_id)
    connections = _local_connections.setdefault(user_id, set())
    was_online = bool(connections)
    connections.add(channel_name)
    return not was_online


def mark_offline(user_id, channel_name):
    """Remove a connection for user_id. Returns True if they just went offline."""
    user_id = str(user_id)
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
    return bool(_local_connections.get(user_id))


def get_last_seen(user_id):
    user_id = str(user_id)
    return _local_last_seen.get(user_id)
