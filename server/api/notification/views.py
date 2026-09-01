from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Notification
from .serializers import NotificationSerializer
from .services import push_unread_count


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        unread_only = str(request.query_params.get("unread", "")).lower() in {"1", "true", "yes"}
        limit = min(int(request.query_params.get("limit", 20) or 20), 100)

        queryset = request.user.notifications.select_related("actor").order_by("-created_at")
        if unread_only:
            queryset = queryset.filter(is_read=False)

        notifications = queryset[:limit]
        unread_count = request.user.notifications.filter(is_read=False).count()
        return Response(
            {
                "notifications": NotificationSerializer(notifications, many=True).data,
                "unread_count": unread_count,
                "count": queryset.count(),
            }
        )


class NotificationReadView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        notification_ids = request.data.get("notification_ids") or []
        mark_all = bool(request.data.get("mark_all"))

        queryset = request.user.notifications.filter(is_read=False)
        if not mark_all:
            if not notification_ids:
                return Response({"error": "Provide notification_ids or set mark_all=true."}, status=400)
            queryset = queryset.filter(notification_id__in=notification_ids)

        updated = queryset.update(is_read=True, read_at=timezone.now())
        push_unread_count(request.user)
        return Response(
            {
                "updated": updated,
                "unread_count": request.user.notifications.filter(is_read=False).count(),
            }
        )
