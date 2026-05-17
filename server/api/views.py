from django.contrib.auth.models import User
from datetime import datetime, timezone as dt_timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.db import transaction

from .models import (
    Role,
    Brand,
    BrandMember,
    Creator,
    CreatorPlatform,
    Campaign,
    CampaignBrief,
    CampaignCreator,
    Deliverable,
    AnalyticsSnapshot,
    Report,
    Invoice,
    Payout,
    Notification,
    ChatRoom,
    ChatMessage,
    Category,
    Tag,
    AIInteraction,
    BrandOnboarding
)
from .permissions import IsAdminLike, IsBrandUser, IsCreatorUser
from .serializers import (
    UserSerializer,
    SignUpSerializer,
    RoleSerializer,
    BrandSerializer,
    CreatorSerializer,
    CreatorPlatformSerializer,
    CampaignSerializer,
    CampaignBriefSerializer,
    CampaignCreatorSerializer,
    DeliverableSerializer,
    AnalyticsSnapshotSerializer,
    ReportSerializer,
    InvoiceSerializer,
    PayoutSerializer,
    NotificationSerializer,
    ChatRoomSerializer,
    ChatMessageSerializer,
    CategorySerializer,
    TagSerializer,
    AIInteractionSerializer,
    BrandSignUpSerializer,
    BrandOnboardingSerializer
)
from .tasks import run_campaign_matching


@api_view(["POST"])
@permission_classes([AllowAny])
def brands_signup(request):
    serializer = BrandSignUpSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    data = serializer.save()

    return Response(
        {
            "message": "Brand signup successful",
            "brand_name": data["brand"].brand_name,
        },
        status=status.HTTP_201_CREATED
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def brand_onboarding(request):

    brand = Brand.objects.filter(created_by=request.user).first()

    if not brand:
        return Response(
            {"error": "Brand not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    profile, _ = BrandOnboarding.objects.get_or_create(
        brand=brand
    )

    serializer = BrandOnboardingSerializer(
        profile,
        data=request.data,
        partial=True
    )

    serializer.is_valid(raise_exception=True)
    serializer.save()

    profile.is_onboarding_completed = True
    profile.save()

    return Response(
        serializer.data,
        status=status.HTTP_200_OK
    )

@api_view(["GET", "POST", "PUT"])
@permission_classes([IsAuthenticated])
def brand_account(request):
    brand = Brand.objects.filter(created_by=request.user).first()

    if not brand:
        return Response(
            {"error": "Brand not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    if request.method == "GET":
        serializer = BrandSerializer(brand)
        return Response(serializer.data)

    elif request.method == "POST":
        serializer = BrandSerializer(brand, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)



@api_view(["POST"])
@permission_classes([AllowAny])
def signup(request):
    serializer = SignUpSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(UserSerializer(request.user).data)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_account(request):
    user = request.user
    with transaction.atomic():
        # `created_by` is PROTECT on Brand, so remove user-owned brand graph first.
        Brand.objects.filter(created_by=user).delete()

        # Remove creator-owned graph (platforms, campaign links, payouts, etc. cascade).
        Creator.objects.filter(user=user).delete()

        # Remove direct links to the user.
        BrandMember.objects.filter(user=user).delete()
        Notification.objects.filter(user=user).delete()
        AIInteraction.objects.filter(actor=user).delete()

        # Clear many-to-many membership references.
        user.chat_rooms.clear()

        # Finally remove the auth user row.
        user.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)



class BaseModelViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(is_deleted=False)


class RoleViewSet(BaseModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated, IsAdminLike]


class CategoryViewSet(BaseModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated, IsAdminLike]


class TagViewSet(BaseModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated, IsAdminLike]


class BrandViewSet(BaseModelViewSet):
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class CreatorViewSet(BaseModelViewSet):
    queryset = Creator.objects.select_related("user")
    serializer_class = CreatorSerializer


class CreatorPlatformViewSet(BaseModelViewSet):
    queryset = CreatorPlatform.objects.select_related("creator")
    serializer_class = CreatorPlatformSerializer


class CampaignViewSet(BaseModelViewSet):
    queryset = Campaign.objects.select_related("brand")
    serializer_class = CampaignSerializer

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, IsAdminLike])
    def trigger_matching(self, request, pk=None):
        task = run_campaign_matching.delay(pk)
        return Response({"task_id": task.id, "status": "queued"}, status=status.HTTP_202_ACCEPTED)


class CampaignBriefViewSet(BaseModelViewSet):
    queryset = CampaignBrief.objects.select_related("campaign")
    serializer_class = CampaignBriefSerializer


class CampaignCreatorViewSet(BaseModelViewSet):
    queryset = CampaignCreator.objects.select_related("campaign", "creator")
    serializer_class = CampaignCreatorSerializer


class DeliverableViewSet(BaseModelViewSet):
    queryset = Deliverable.objects.select_related("campaign_creator")
    serializer_class = DeliverableSerializer


class AnalyticsSnapshotViewSet(BaseModelViewSet):
    queryset = AnalyticsSnapshot.objects.select_related("creator_platform")
    serializer_class = AnalyticsSnapshotSerializer
    permission_classes = [IsAuthenticated, IsAdminLike]


class ReportViewSet(BaseModelViewSet):
    queryset = Report.objects.select_related("campaign")
    serializer_class = ReportSerializer


class InvoiceViewSet(BaseModelViewSet):
    queryset = Invoice.objects.select_related("brand", "campaign")
    serializer_class = InvoiceSerializer


class PayoutViewSet(BaseModelViewSet):
    queryset = Payout.objects.select_related("creator", "campaign_creator")
    serializer_class = PayoutSerializer


class NotificationViewSet(BaseModelViewSet):
    queryset = Notification.objects.select_related("user")
    serializer_class = NotificationSerializer


class ChatRoomViewSet(BaseModelViewSet):
    queryset = ChatRoom.objects.all()
    serializer_class = ChatRoomSerializer


class ChatMessageViewSet(BaseModelViewSet):
    queryset = ChatMessage.objects.select_related("room", "sender")
    serializer_class = ChatMessageSerializer



class AIInteractionViewSet(BaseModelViewSet):
    queryset = AIInteraction.objects.select_related("actor")
    serializer_class = AIInteractionSerializer
    permission_classes = [IsAuthenticated, IsAdminLike]






