from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..permissions import IsAdminUserRole
from .models import RateCards
from .serializers import RateCardsSerializer


class RateCardsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request, rate_card_id=None):
        if rate_card_id:
            rate_card = RateCards.objects.filter(id=rate_card_id).first()
            if not rate_card:
                return Response({"error": "Rate card not found."}, status=status.HTTP_404_NOT_FOUND)
            return Response({"rate_card": RateCardsSerializer(rate_card).data})

        rate_cards = RateCards.objects.all().order_by("platform", "sort_order", "service")
        return Response({"rate_cards": RateCardsSerializer(rate_cards, many=True).data})

    def post(self, request):
        serializer = RateCardsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        rate_card = serializer.save()
        return Response({"rate_card": RateCardsSerializer(rate_card).data}, status=status.HTTP_201_CREATED)

    def put(self, request, rate_card_id):
        rate_card = RateCards.objects.filter(id=rate_card_id).first()
        if not rate_card:
            return Response({"error": "Rate card not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = RateCardsSerializer(rate_card, data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response({"rate_card": RateCardsSerializer(serializer.save()).data})

    def delete(self, request, rate_card_id):
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
