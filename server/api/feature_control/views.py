from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..permissions import IsAdminUserRole
from .models import RateCards
from .serializers import RateCardsSerializer


class RateCardsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def has_rate_card_permission(self, request, permission):
        if request.user.is_superuser:
            return True
        role_details = getattr(request.user, "role_details", None)
        assigned_role = role_details.assigned_role if role_details else None
        return bool(
            assigned_role
            and (
                assigned_role.is_wildcard
                or assigned_role.permissions.filter(key=permission).exists()
            )
        )

    def deny_without_permission(self, request, permission):
        if self.has_rate_card_permission(request, permission):
            return None
        return Response(
            {"error": "You do not have permission to manage rate cards."},
            status=status.HTTP_403_FORBIDDEN,
        )

    def get(self, request, rate_card_id=None):
        denied = self.deny_without_permission(request, "rate_cards.view")
        if denied:
            return denied
        if rate_card_id:
            rate_card = RateCards.objects.filter(id=rate_card_id).first()
            if not rate_card:
                return Response({"error": "Rate card not found."}, status=status.HTTP_404_NOT_FOUND)
            return Response({"rate_card": RateCardsSerializer(rate_card).data})

        rate_cards = RateCards.objects.all().order_by("platform", "sort_order", "service")
        return Response({"rate_cards": RateCardsSerializer(rate_cards, many=True).data})

    def post(self, request):
        denied = self.deny_without_permission(request, "rate_cards.create")
        if denied:
            return denied
        serializer = RateCardsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        rate_card = serializer.save()
        return Response({"rate_card": RateCardsSerializer(rate_card).data}, status=status.HTTP_201_CREATED)

    def put(self, request, rate_card_id):
        denied = self.deny_without_permission(request, "rate_cards.edit")
        if denied:
            return denied
        rate_card = RateCards.objects.filter(id=rate_card_id).first()
        if not rate_card:
            return Response({"error": "Rate card not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = RateCardsSerializer(rate_card, data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response({"rate_card": RateCardsSerializer(serializer.save()).data})

    def delete(self, request, rate_card_id):
        denied = self.deny_without_permission(request, "rate_cards.delete")
        if denied:
            return denied
        rate_card = RateCards.objects.filter(id=rate_card_id).first()
        if not rate_card:
            return Response({"error": "Rate card not found."}, status=status.HTTP_404_NOT_FOUND)

        rate_card.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CreatorRateCardsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        rate_cards = RateCards.objects.all().order_by("platform", "sort_order", "service")
        return Response({"rate_cards": RateCardsSerializer(rate_cards, many=True).data})
