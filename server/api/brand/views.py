from django.db import transaction
from django.db.models import Count, Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import (
    ApplicationStatus, BrandProfile, BrandShortlist, Campaign, CampaignApplication, CampaignProgress, CampaignStatus, CampaignStatusSummary, CreatorProfile, ShortlistStatus, UserRole, VerificationStatus,
)
from ..permissions import IsBrand, IsCreator, IsVerifiedColluneMember
from ..common.services import auth_response, create_user, parse_payload
from .serializers import (
    BrandProfileSerializer, BrandRegisterSerializer, BrandShortlistSerializer, CampaignApplicationSerializer,
    CampaignProgressSerializer, CampaignSerializer, CampaignStatusSummarySerializer,
)


class Pagination(PageNumberPagination):
    page_size = 6
    page_size_query_param = "page_size"
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response({
            "count": self.page.paginator.count,
            "next": self.get_next_link(),
            "previous": self.get_previous_link(),
            "page": self.page.number,
            "total_pages": self.page.paginator.num_pages,
            "page_size": self.get_page_size(self.request),
            "campaigns": data,
        })


class BrandRegisterView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    @transaction.atomic
    def post(self, request):
        serializer = BrandRegisterSerializer(data=parse_payload(request))
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        user = create_user(data["user"], UserRole.BRAND)
        brand = BrandProfile.objects.create(
            user=user,
            company_name=data["company_name"],
            industry=data.get("industry", ""),
            website=data.get("website", ""),
            company_size=data.get("company_size", ""),
            linkedin_url=data.get("linkedin_url", ""),
            logo=data.get("logo"),
            verification_status=VerificationStatus.VERIFIED
        )
        return Response(
            {
                **auth_response(user, "Brand account created."),
                "brand": BrandProfileSerializer(brand, context={"request": request}).data,
            },
            status=status.HTTP_201_CREATED,
        )

class BrandsListView(APIView):
    permission_classes = [IsAuthenticated, IsVerifiedColluneMember]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        return BrandProfile.objects.select_related("user").filter(
            verification_status=VerificationStatus.VERIFIED,
            is_profile_visible=True,
        )

    def get(self, request, brand_id=None):
        if brand_id:
            try:
                brand = self.get_queryset().get(brand_id=brand_id)
            except BrandProfile.DoesNotExist:
                return Response({"error": "Brand profile not found."}, status=status.HTTP_404_NOT_FOUND)
            serializer = BrandProfileSerializer(brand, context={"request": request})
            return Response({"brand": serializer.data})

        brands = self.get_queryset().order_by("-created_at")
        serializer = BrandProfileSerializer(brands, many=True, context={"request": request})
        return Response({"brands": serializer.data})
    
class BrandDetailDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsBrand]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request):
        brand = getattr(request.user, "brand_profile", None)
        if not brand:
            return Response({"error": "No brand profile found."}, status=status.HTTP_404_NOT_FOUND)
        
        brand_campaigns = Campaign.objects.filter(brand=brand)
        brand_shortlists = BrandShortlist.objects.filter(brand=brand)
        active_campaigns = brand_campaigns.filter(status=CampaignStatus.ACTIVE).order_by("-created_at")
        active_shortlists = brand_shortlists.filter(status=ShortlistStatus.SUBMITTED).order_by("-created_at")
        result = {
            "no_of_active_campaigns": active_campaigns.count(),
            "no_of_active_shortlists": active_shortlists.count(),
            "collaborations_active": 0,
            "active_campaigns": [
                {
                    "id": campaign.campaign_id,
                    "name": campaign.title,
                    "status": campaign.status,
                    "applications_received_count": CampaignApplication.objects.filter(campaign=campaign).count(),
                    "recommended_creators_count": CampaignApplication.objects.filter(campaign=campaign, status=ApplicationStatus.ACCEPTED).count(),
                }
                for campaign in active_campaigns[:3]
            ],
            "active_shortlists": [
                {
                    "id": shortlist.shortlist_id,
                    "name": shortlist.title,
                    "status": shortlist.status,
                    "creators_count": shortlist.creators.count(),
                }
                for shortlist in active_shortlists[:3]
            ],

        }
        return Response({"brand_dashboard": result})
    
class CampaignsViewSet(APIView):
    permission_classes = [IsAuthenticated, IsBrand]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    pagination_class = Pagination

    def get(self, request):
        brand = getattr(request.user, "brand_profile", None)
        if not brand:
            return Response({"error": "No brand profile found."}, status=status.HTTP_404_NOT_FOUND)

        campaigns = (
            Campaign.objects.filter(brand=brand)
            .annotate(
                applications_received_count=Count("applications", distinct=True),
                recommended_creators_count=Count(
                    "applications",
                    filter=Q(applications__status=ApplicationStatus.ACCEPTED),
                    distinct=True,
                ),
            )
            .order_by("-updated_at")
        )

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(campaigns, request, view=self)
        campaign_page = page if page is not None else campaigns

        data = [
            {
                "id": str(campaign.campaign_id),
                "name": campaign.title,
                "status": campaign.status,
                "applications_received_count": campaign.applications_received_count,
                "recommended_creators_count": campaign.recommended_creators_count,
                "updated_at": campaign.updated_at.isoformat(),
            }
            for campaign in campaign_page
        ]

        if page is not None:
            return paginator.get_paginated_response(data)
        return Response({"campaigns": data})

class ShortlistViewSet(APIView):
    permission_classes = [IsAuthenticated, IsBrand]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    pagination_class = Pagination

    def get(self, request):
        brand = getattr(request.user, "brand_profile", None)
        if not brand:
            return Response({"error": "No brand profile found."}, status=status.HTTP_404_NOT_FOUND)

        shortlists = (
            BrandShortlist.objects.filter(brand=brand)
            .annotate(creators_count=Count("creators", distinct=True))
            .order_by("-updated_at")
        )

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(shortlists, request, view=self)
        shortlist_page = page if page is not None else shortlists

        data = [
            {
                "id": str(shortlist.shortlist_id),
                "name": shortlist.title,
                "status": shortlist.status,
                "creators_count": shortlist.creators_count,
                "updated_at": shortlist.updated_at.isoformat(),
            }
            for shortlist in shortlist_page
        ]

        if page is not None:
            return paginator.get_paginated_response(data)
        return Response({"shortlists": data})
    
class BrandProfileViewSet(viewsets.ModelViewSet):
    serializer_class = BrandProfileSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        if self.request.user.role == UserRole.ADMIN:
            return BrandProfile.objects.select_related("user").all()
        if self.request.user.role == UserRole.BRAND:
            return BrandProfile.objects.select_related("user").filter(user=self.request.user)
        return BrandProfile.objects.select_related("user").filter(
            verification_status=VerificationStatus.VERIFIED,
            is_profile_visible=True,
        )

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [IsAuthenticated(), IsVerifiedColluneMember()]
        return super().get_permissions()

    @action(detail=False, methods=["get", "patch"], url_path="me")
    def me(self, request):
        brand = getattr(request.user, "brand_profile", None)
        if not brand:
            return Response({"error": "No brand profile found."}, status=status.HTTP_404_NOT_FOUND)
        if request.method == "PATCH":
            serializer = self.get_serializer(brand, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response({"brand": serializer.data})
        return Response({"brand": self.get_serializer(brand).data})

class CampaignViewSet(viewsets.ModelViewSet):
    serializer_class = CampaignSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        queryset = (
            Campaign.objects.select_related("brand", "brand__user")
            .prefetch_related("progress_steps")
            .annotate(
                applications_received_count=Count("applications", distinct=True),
                recommended_creators_count=Count(
                    "applications",
                    filter=Q(applications__status=ApplicationStatus.ACCEPTED),
                    distinct=True,
                ),
            )
        )
        if self.request.user.role == UserRole.BRAND:
            return queryset.filter(brand__user=self.request.user)
        if self.request.user.role == UserRole.CREATOR:
            return queryset.filter(status=CampaignStatus.ACTIVE)
        return queryset.all()

    def perform_create(self, serializer):
        serializer.save(brand=self.request.user.brand_profile)

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAuthenticated(), IsBrand()]
        return super().get_permissions()

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, IsCreator])
    def apply(self, request, pk=None):
        campaign = self.get_object()
        application, _ = CampaignApplication.objects.update_or_create(
            campaign=campaign,
            creator=request.user.creator_profile,
            defaults={
                "pitch": request.data.get("pitch", ""),
                "quoted_rate": request.data.get("quoted_rate") or 0,
                "status": ApplicationStatus.APPLIED,
            },
        )
        serializer = CampaignApplicationSerializer(application, context={"request": request})
        return Response({"application": serializer.data}, status=status.HTTP_201_CREATED)

class CampaignStatusSummaryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CampaignStatusSummarySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        campaigns = Campaign.objects.select_related("brand", "brand__user").annotate(
            applications_received_count=Count("applications", distinct=True),
            recommended_creators_count=Count(
                "applications",
                filter=Q(applications__status=ApplicationStatus.ACCEPTED),
                distinct=True,
            ),
        )
        if self.request.user.role == UserRole.BRAND:
            campaigns = campaigns.filter(brand__user=self.request.user)
        if self.request.user.role == UserRole.CREATOR:
            campaigns = campaigns.filter(status=CampaignStatus.ACTIVE)
        return campaigns

class CampaignProgressViewSet(viewsets.ModelViewSet):
    serializer_class = CampaignProgressSerializer
    permission_classes = [IsAuthenticated, IsBrand]

    def get_queryset(self):
        return CampaignProgress.objects.select_related("campaign", "campaign__brand").filter(
            campaign__brand__user=self.request.user
        )

    def perform_create(self, serializer):
        campaign = serializer.validated_data["campaign"]
        if campaign.brand.user != self.request.user:
            raise PermissionDenied("You can only update progress for your own campaigns.")
        serializer.save()

class BrandShortlistViewSet(viewsets.ModelViewSet):
    serializer_class = BrandShortlistSerializer
    permission_classes = [IsAuthenticated, IsBrand]

    def get_queryset(self):
        return BrandShortlist.objects.select_related("brand").prefetch_related("creators", "creators__user").filter(
            brand__user=self.request.user
        )

    def perform_create(self, serializer):
        serializer.save(brand=self.request.user.brand_profile)
