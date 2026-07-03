from django.db import transaction
from django.db.models import Count, Prefetch, Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import (
    ApplicationStatus, BrandProfile, BrandShortlist, Campaign, CampaignApplication, CreatorProfile, ShortlistStatus, UserRole, VerificationStatus,
)
from ..permissions import IsBrand, IsCreator, IsVerifiedColluneMember
from ..common.services import auth_response, create_user, parse_payload
from .serializers import (
    BrandProfileSerializer, BrandRegisterSerializer, BrandShortlistSerializer, CampaignApplicationSerializer,
     CampaignSerializer,
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
    
class BrandDetailDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsBrand]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    @staticmethod
    def _campaign_status(campaign, today):
        if campaign.end_date and campaign.end_date < today:
            return "Completed"
        return "Open"

    @staticmethod
    def _brand_logo_url(request, brand):
        if not brand.logo:
            return ""
        return request.build_absolute_uri(brand.logo.url)

    def get(self, request):
        brand = getattr(request.user, "brand_profile", None)
        if not brand:
            return Response({"error": "No brand profile found."}, status=status.HTTP_404_NOT_FOUND)

        today = timezone.localdate()
        active_campaigns = (
            Campaign.objects.filter(brand=brand)
            .filter(Q(end_date__isnull=True) | Q(end_date__gte=today))
            .annotate(
                applications_received_count=Count("applications", distinct=True),
                recommended_creators_count=Count(
                    "applications",
                    filter=Q(applications__status=ApplicationStatus.ACCEPTED),
                    distinct=True,
                ),
            )
            .order_by("-created_at")
        )
        active_shortlists = (
            BrandShortlist.objects.filter(brand=brand, status=ShortlistStatus.SUBMITTED)
            .annotate(creators_count=Count("creators", distinct=True))
            .order_by("-created_at")
        )
        collaborations_active = CampaignApplication.objects.filter(
            campaign__brand=brand,
            status=ApplicationStatus.ACCEPTED,
        ).count()

        result = {
            "brand": {
                "brand_id": str(brand.brand_id),
                "company_name": brand.company_name,
                "industry": brand.industry,
                "website": brand.website,
                "company_size": brand.company_size,
                "linkedin_url": brand.linkedin_url,
                "logo_url": self._brand_logo_url(request, brand),
            },
            "no_of_active_campaigns": active_campaigns.count(),
            "no_of_active_shortlists": active_shortlists.count(),
            "no_of_submitted_shortlists": active_shortlists.count(),
            "collaborations_active": collaborations_active,
            "active_campaigns": [
                {
                    "id": str(campaign.campaign_id),
                    "name": campaign.title,
                    "status": self._campaign_status(campaign, today),
                    "applications_received_count": campaign.applications_received_count,
                    "recommended_creators_count": campaign.recommended_creators_count,
                    "updated_at": campaign.updated_at.isoformat(),
                }
                for campaign in active_campaigns[:4]
            ],
            "active_shortlists": [
                {
                    "id": str(shortlist.shortlist_id),
                    "name": shortlist.title,
                    "status": shortlist.get_status_display(),
                    "creators_count": shortlist.creators_count,
                    "updated_at": shortlist.updated_at.isoformat(),
                }
                for shortlist in active_shortlists[:4]
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
    
    def post(self,request):



        return Response({"message":"sucessfully created"})

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
            return queryset.all()
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
                "status": ApplicationStatus.APPLIED,
            },
        )
        serializer = CampaignApplicationSerializer(application, context={"request": request})
        return Response({"application": serializer.data}, status=status.HTTP_201_CREATED)


class BrandShortlistViewSet(viewsets.ModelViewSet):
    serializer_class = BrandShortlistSerializer
    permission_classes = [IsAuthenticated, IsBrand]

    def get_queryset(self):
        visible_creators = CreatorProfile.objects.select_related("user").filter(user__is_profile_visible=True)
        return (
            BrandShortlist.objects.select_related("brand")
            .prefetch_related(Prefetch("creators", queryset=visible_creators))
            .filter(brand__user=self.request.user)
        )

    def perform_create(self, serializer):
        serializer.save(brand=self.request.user.brand_profile)
