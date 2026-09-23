import uuid

from django.db import models
from django.utils import timezone



class RateCards(models.Model):
    """An admin-managed platform and service/content-type dropdown option."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, db_column="id")
    platform = models.CharField(max_length=32)
    service = models.CharField(max_length=150)
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)


__all__ = [ "RateCards"]
