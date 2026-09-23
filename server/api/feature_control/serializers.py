from rest_framework import serializers

from .models import RateCards


class RateCardsSerializer(serializers.ModelSerializer):
    class Meta:
        model = RateCards
        fields = ("id", "platform", "service", "sort_order", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")
