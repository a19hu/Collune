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
from django.shortcuts import get_object_or_404

from ..models import (
    ApplicationStatus, BrandProfile, BrandSavedCreator, BrandShortlist, Campaign, CampaignApplication, CreatorProfile, ShortlistStatus, UserRole, VerificationStatus,
)
from ..notification import create_notification, notify_admins
from ..permissions import IsBrand, IsCreator, IsVerifiedColluneMember
from ..common.services import auth_response, create_user, parse_payload
from .serializers import (
    BrandProfileSerializer, BrandRegisterSerializer, BrandShortlistSerializer, CampaignApplicationSerializer,
     CampaignSerializer,
)
from decimal import Decimal
from datetime import datetime
import json

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


class ShortlistPagination(Pagination):
    def get_paginated_response(self, data):
        return Response({
            "count": self.page.paginator.count,
            "next": self.get_next_link(),
            "previous": self.get_previous_link(),
            "page": self.page.number,
            "total_pages": self.page.paginator.num_pages,
            "page_size": self.get_page_size(self.request),
            "shortlists": data,
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
            about_brand=data.get("about_brand", ""),
            gst_number=data.get("gst_number", ""),
            cin_registration_number=data.get("cin_registration_number", ""),
            year_established=data.get("year_established"),
            headquarters_city=data.get("headquarters_city", ""),
            headquarters_state=data.get("headquarters_state", ""),
            headquarters_country=data.get("headquarters_country", ""),
            instagram_url=data.get("instagram_url", ""),
            facebook_url=data.get("facebook_url", ""),
            x_url=data.get("x_url", ""),
            youtube_url=data.get("youtube_url", ""),
            gst_certificate=data.get("gst_certificate"),
            pan_card=data.get("pan_card"),
            company_registration_certificate=data.get("company_registration_certificate"),
            logo=data.get("logo"),
        )
        create_notification(
            recipient=user,
            event_type="brand.account.created",
            title="Brand account created",
            message="Your brand account was created successfully.",
            data={"brand_id": str(brand.brand_id), "company_name": brand.company_name},
        )
        notify_admins(
            event_type="brand.account.created",
            title="New brand registration",
            message=f"{brand.company_name} joined the platform.",
            actor=user,
            data={"brand_id": str(brand.brand_id), "company_name": brand.company_name},
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
                "about_brand": brand.about_brand,
                "website": brand.website,
                "company_size": brand.company_size,
                "linkedin_url": brand.linkedin_url,
                "gst_number": brand.gst_number,
                "cin_registration_number": brand.cin_registration_number,
                "year_established": brand.year_established,
                "headquarters_city": brand.headquarters_city,
                "headquarters_state": brand.headquarters_state,
                "headquarters_country": brand.headquarters_country,
                "instagram_url": brand.instagram_url,
                "facebook_url": brand.facebook_url,
                "x_url": brand.x_url,
                "youtube_url": brand.youtube_url,
                "gst_certificate": request.build_absolute_uri(brand.gst_certificate.url) if brand.gst_certificate else None,
                "pan_card": request.build_absolute_uri(brand.pan_card.url) if brand.pan_card else None,
                "company_registration_certificate": request.build_absolute_uri(brand.company_registration_certificate.url) if brand.company_registration_certificate else None,
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


class BrandLogoCarouselView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        brands = BrandProfile.objects.exclude(logo="").exclude(logo__isnull=True).order_by("company_name")
        data = [
            {
                "id": str(brand.brand_id),
                "logo": request.build_absolute_uri(brand.logo.url),
            }
            for brand in brands
            if brand.logo
        ]
        return Response({"brands": data})
    
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
                "status": "Active",
                "applications_received_count": campaign.applications_received_count,
                "recommended_creators_count": campaign.recommended_creators_count,
                "updated_at": campaign.updated_at.isoformat(),
            }
            for campaign in campaign_page
        ]

        if page is not None:
            return paginator.get_paginated_response(data)
        return Response({"campaigns": data})
    
    def post(self, request):
        brand = getattr(request.user, "brand_profile", None)

        if not brand:
            return Response(
                {"error": "No brand profile found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        data = request.data

        guidelines = request.FILES.get("brand_guidelines")
        if guidelines and guidelines.content_type != "application/pdf":
            return Response(
                {"error": "Brand guidelines must be a PDF file."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cover_image = request.FILES.get("cover_image")
        if cover_image and cover_image.content_type not in {"image/jpeg", "image/png"}:
            return Response(
                {"error": "Cover image must be a PNG or JPG file."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        deliverable_pricing = data.get("deliverable_pricing", {})
        if isinstance(deliverable_pricing, str):
            try:
                deliverable_pricing = json.loads(deliverable_pricing) if deliverable_pricing else {}
            except json.JSONDecodeError:
                return Response(
                    {"error": "Deliverable pricing must be valid JSON."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        try:
            campaign = Campaign.objects.create(
                brand=brand,
                title=data.get("title"),
                internal_reference_name=data.get("internal_reference_name", ""),
                brief=data.get("brief"),
                objective=data.get("objective", ""),
                deliverables=data.get("deliverables", ""),
                brand_requirements=data.get("brand_requirements", ""),
                creative_direction=data.get("creative_direction", ""),
                tone_of_communication=data.get("tone_of_communication", ""),
                brand_guidelines=guidelines,
                content_references=data.get("content_references", ""),
                platforms=data.getlist("platforms")
                    if hasattr(data, "getlist")
                    else data.get("platforms", []),
                category=data.get("category", ""),
                audience_type=data.get("audience_type", ""),
                location=data.get("location", ""),
                minimum_followers=int(data.get("minimum_followers", 0)),
                language_preference=data.get("language_preference", ""),
                content_style=data.get("content_style", ""),
                additional_preferences=data.get("additional_preferences", ""),
                total_budget=Decimal(data.get("total_budget", 0)),
                budget_range=data.get("budget_range", ""),
                compensation_type=data.get("compensation_type", ""),
                deliverable_pricing=deliverable_pricing,
                start_date=datetime.strptime(
                    data["start_date"], "%Y-%m-%d"
                ).date() if data.get("start_date") else None,
                end_date=datetime.strptime(
                    data["end_date"], "%Y-%m-%d"
                ).date() if data.get("end_date") else None,
                deadline=datetime.strptime(
                    data["deadline"], "%Y-%m-%d"
                ).date() if data.get("deadline") else None,
                cover_image=cover_image,
            )

        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        create_notification(
            recipient=request.user,
            event_type="campaign.created",
            title="Campaign created",
            message=f"Campaign '{campaign.title}' was created.",
            actor=request.user,
            data={"campaign_id": str(campaign.campaign_id), "title": campaign.title},
        )
        notify_admins(
            event_type="campaign.created",
            title="New campaign created",
            message=f"{brand.company_name} created campaign '{campaign.title}'.",
            actor=request.user,
            data={"campaign_id": str(campaign.campaign_id), "brand_id": str(brand.brand_id)},
        )
        return Response(
            {
                "message": "Campaign created successfully.",
            },
            status=status.HTTP_201_CREATED,
        )

class CampaignReviewView(APIView):
    permission_classes = [IsAuthenticated, IsBrand]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    @staticmethod
    def _as_list(value):
        if value is None:
            return []
        if isinstance(value, list):
            return value
        if hasattr(value, "getlist"):
            return value.getlist("platforms")
        return [value]

    def post(self, request):
        data = request.data
        platforms = [str(platform).upper() for platform in self._as_list(data.get("platforms")) if platform]
        category = str(data.get("category", "")).strip()
        location = str(data.get("location", "")).strip()
        language = str(data.get("language_preference", "")).strip()

        try:
            minimum_followers = int(data.get("minimum_followers") or 0)
        except (TypeError, ValueError):
            minimum_followers = 0

        creators = CreatorProfile.objects.filter(
            user__is_profile_visible=True,
            user__verification_status=VerificationStatus.VERIFIED,
        ).prefetch_related("social_accounts")

        if category:
            creators = creators.filter(category__icontains=category)
        if location and location.lower() != "global":
            creators = creators.filter(location__icontains=location)

        matched_creator_ids = set()
        category_counts = {}

        for creator in creators:
            if language and language not in creator.languages:
                continue

            accounts = list(creator.social_accounts.all())
            if platforms:
                accounts = [account for account in accounts if account.platform in platforms]
            if minimum_followers:
                accounts = [account for account in accounts if account.followers >= minimum_followers]
            if not accounts:
                continue

            matched_creator_ids.add(str(creator.creator_id))
            if creator.category:
                category_counts[creator.category] = category_counts.get(creator.category, 0) + 1

        suggested_categories = [
            {"name": name, "matches": matches}
            for name, matches in sorted(category_counts.items(), key=lambda item: item[1], reverse=True)[:4]
        ]

        if not suggested_categories:
            fallback_categories = (
                CreatorProfile.objects.filter(user__is_profile_visible=True, category__gt="")
                .values("category")
                .annotate(matches=Count("creator_id"))
                .order_by("-matches")[:4]
            )
            suggested_categories = [
                {"name": item["category"], "matches": item["matches"]}
                for item in fallback_categories
            ]

        return Response({
            "estimated_creator_matches": len(matched_creator_ids),
            "suggested_creator_categories": suggested_categories,
        })

class BrandCampaignApplicationViewSet(APIView):
    permission_classes = [IsAuthenticated, IsBrand]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_campaign(self, request, campaign_id):
        brand = getattr(request.user, "brand_profile", None)

        return get_object_or_404(
            Campaign,
            campaign_id=campaign_id,
            brand=brand
        )

    def get(self, request, campaign_id):
        campaign = (
                    Campaign.objects.filter(
                        campaign_id=campaign_id,
                        brand=request.user.brand_profile,
                    )
                    .annotate(
                        applications_received_count=Count("applications", distinct=True),
                        recommended_creators_count=Count(
                            "applications",
                            filter=Q(applications__status=ApplicationStatus.ACCEPTED),
                            distinct=True,
                        ),
                    )
                    .prefetch_related(
                        Prefetch(
                            "applications",
                            queryset=CampaignApplication.objects.select_related(
                                "creator",
                                "creator__user",
                            ).order_by("-created_at"),
                        )
                    )
                    .first()
                )

        if not campaign:
            return Response({"error": "Campaign not found."}, status=status.HTTP_404_NOT_FOUND)

        def file_url(file):
            if not file:
                return ""
            return request.build_absolute_uri(file.url)

        data = {
            "campaign_id": str(campaign.campaign_id),
            "id": str(campaign.campaign_id),
            "name": campaign.title,
            "status": "Active",
            "title": campaign.title,
            "internal_reference_name": campaign.internal_reference_name,
            "brief": campaign.brief,
            "objective": campaign.objective,
            "deliverables": campaign.deliverables,
            "brand_requirements": campaign.brand_requirements,
            "creative_direction": campaign.creative_direction,
            "tone_of_communication": campaign.tone_of_communication,
            "brand_guidelines": file_url(campaign.brand_guidelines),
            "brand_guidelines_url": file_url(campaign.brand_guidelines),
            "content_references": campaign.content_references,
            "platforms": campaign.platforms,
            "category": campaign.category,
            "audience_type": campaign.audience_type,
            "location": campaign.location,
            "minimum_followers": campaign.minimum_followers,
            "language_preference": campaign.language_preference,
            "content_style": campaign.content_style,
            "additional_preferences": campaign.additional_preferences,
            "total_budget": str(campaign.total_budget),
            "budget_range": campaign.budget_range,
            "compensation_type": campaign.compensation_type,
            "deliverable_pricing": campaign.deliverable_pricing,
            "start_date": campaign.start_date.isoformat() if campaign.start_date else None,
            "end_date": campaign.end_date.isoformat() if campaign.end_date else None,
            "deadline": campaign.deadline.isoformat() if campaign.deadline else None,
            "cover_image": file_url(campaign.cover_image),
            "created_at": campaign.created_at.isoformat(),
            "updated_at": campaign.updated_at.isoformat(),
            "applications_received_count": campaign.applications_received_count,
            "recommended_creators_count": campaign.recommended_creators_count,
            "applications": [
                {
                    "application_id": str(app.application_id),
                    "campaign": str(campaign.campaign_id),
                    "creator": str(app.creator.creator_id),
                    "status": app.status,
                    "created_at": app.created_at.isoformat(),
                    "updated_at": app.updated_at.isoformat(),
                    "creator_detail": {
                        "creator_id": str(app.creator.creator_id),
                        "display_name": app.creator.display_name,
                        "category": app.creator.category,
                        "location": app.creator.location,
                        "profile_image_url": file_url(app.creator.profile_image),
                        "user": {
                            "name": app.creator.user.name,
                            "username": app.creator.user.username,
                            "email": app.creator.user.email,
                        },
                        "social_accounts": [
                            {
                                "platform": account.platform,
                                "followers": account.followers,
                                "engagement_rate": account.engagement_rate,
                                "is_connected": account.is_connected,
                            }
                            for account in app.creator.social_accounts.all()
                        ],
                    },
                }
                for app in campaign.applications.all()
            ],
            "recommended_creators": [
                {
                "creator_id": str(app.creator.creator_id),
                "name": app.creator.display_name,
                "username": app.creator.user.username,
                "email": app.creator.user.email,
                "profile_picture": file_url(app.creator.profile_image),
                }
                for app in campaign.applications.all()
                if app.status == ApplicationStatus.ACCEPTED
            ],
        }

        return Response(data)

    def patch(self, request, campaign_id):
        campaign = self.get_campaign(request, campaign_id)

        data = request.data

        cover_image = request.FILES.get("cover_image")
        if cover_image and cover_image.content_type not in {"image/jpeg", "image/png"}:
            return Response(
                {"error": "Cover image must be a PNG or JPG file."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        guidelines = request.FILES.get("brand_guidelines")
        if guidelines and guidelines.content_type != "application/pdf":
            return Response(
                {"error": "Brand guidelines must be a PDF file."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        deliverable_pricing = data.get("deliverable_pricing")
        if isinstance(deliverable_pricing, str):
            try:
                deliverable_pricing = json.loads(deliverable_pricing) if deliverable_pricing else {}
            except json.JSONDecodeError:
                return Response(
                    {"error": "Deliverable pricing must be valid JSON."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        for field in [
            "title",
            "internal_reference_name",
            "brief",
            "objective",
            "deliverables",
            "brand_requirements",
            "creative_direction",
            "tone_of_communication",
            "content_references",
            "platforms",
            "category",
            "audience_type",
            "location",
            "minimum_followers",
            "language_preference",
            "content_style",
            "additional_preferences",
            "total_budget",
            "budget_range",
            "compensation_type",
            "start_date",
            "end_date",
            "deadline",
        ]:
            if field in data:
                setattr(campaign, field, data[field])

        if hasattr(data, "getlist") and "platforms" in data:
            campaign.platforms = data.getlist("platforms")
        elif "platforms" in data:
            campaign.platforms = data.get("platforms") or []

        if deliverable_pricing is not None:
            campaign.deliverable_pricing = deliverable_pricing

        if guidelines:
            campaign.brand_guidelines = guidelines
        if cover_image:
            campaign.cover_image = cover_image

        campaign.save()

        create_notification(
            recipient=request.user,
            event_type="campaign.updated",
            title="Campaign updated",
            message=f"Campaign '{campaign.title}' was updated.",
            actor=request.user,
            data={"campaign_id": str(campaign.campaign_id), "title": campaign.title},
        )

        return Response({
            "message": "Campaign updated successfully."
        })

    def delete(self, request, campaign_id):
        campaign = self.get_campaign(request, campaign_id)
        campaign_title = campaign.title
        campaign_pk = str(campaign.campaign_id)
        campaign.delete()

        create_notification(
            recipient=request.user,
            event_type="campaign.deleted",
            title="Campaign deleted",
            message=f"Campaign '{campaign_title}' was deleted.",
            actor=request.user,
            data={"campaign_id": campaign_pk, "title": campaign_title},
        )

        return Response(
            {"message": "Campaign deleted successfully."},
            status=status.HTTP_204_NO_CONTENT,
        )


class ShortlistViewSet(APIView):
    permission_classes = [IsAuthenticated, IsBrand]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    pagination_class = ShortlistPagination

    def get_queryset(self, request):
        brand = getattr(request.user, "brand_profile", None)
        if not brand:
            return None

        visible_creators = CreatorProfile.objects.select_related("user").filter(user__is_profile_visible=True)
        return (
            BrandShortlist.objects.filter(brand=brand)
            .prefetch_related(Prefetch("creators", queryset=visible_creators))
            .annotate(creators_count=Count("creators", distinct=True))
            .order_by("-updated_at")
        )

    def get_shortlist(self, request, shortlist_id):
        queryset = self.get_queryset(request)
        if queryset is None:
            return None
        return get_object_or_404(queryset, shortlist_id=shortlist_id)

    def normalize_payload(self, data):
        payload = data.copy() if hasattr(data, "copy") else dict(data)

        if "categories" not in payload and data.get("category"):
            payload["categories"] = data.get("category")
        if "audience" not in payload and data.get("audience_type"):
            payload["audience"] = data.get("audience_type")
        if "timeline" not in payload and data.get("deadline"):
            payload["timeline"] = data.get("deadline")
        if hasattr(data, "getlist"):
            if "platforms" in data:
                payload["platforms"] = data.getlist("platforms")
            if "creators" in data:
                payload["creators"] = data.getlist("creators")
        return payload

    def get(self, request, shortlist_id=None):
        if not getattr(request.user, "brand_profile", None):
            return Response({"error": "No brand profile found."}, status=status.HTTP_404_NOT_FOUND)

        if shortlist_id:
            shortlist = self.get_shortlist(request, shortlist_id)
            serializer = BrandShortlistSerializer(shortlist, context={"request": request})
            return Response(serializer.data)

        shortlists = self.get_queryset(request)
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(shortlists, request, view=self)
        shortlist_page = page if page is not None else shortlists

        data = BrandShortlistSerializer(shortlist_page, many=True, context={"request": request}).data

        if page is not None:
            return paginator.get_paginated_response(data)
        return Response({"shortlists": data})

    def post(self, request):
        brand = getattr(request.user, "brand_profile", None)

        if not brand:
            return Response(
                {"error": "No brand profile found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        payload = self.normalize_payload(request.data)
        serializer = BrandShortlistSerializer(data=payload, context={"request": request})
        serializer.is_valid(raise_exception=True)
        shortlist = serializer.save(brand=brand)
        create_notification(
            recipient=request.user,
            event_type="shortlist.created",
            title="Shortlist created",
            message=f"Shortlist '{shortlist.title}' was created.",
            actor=request.user,
            data={"shortlist_id": str(shortlist.shortlist_id), "title": shortlist.title},
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def patch(self, request, shortlist_id):
        if not getattr(request.user, "brand_profile", None):
            return Response({"error": "No brand profile found."}, status=status.HTTP_404_NOT_FOUND)

        shortlist = self.get_shortlist(request, shortlist_id)
        payload = self.normalize_payload(request.data)
        serializer = BrandShortlistSerializer(shortlist, data=payload, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        create_notification(
            recipient=request.user,
            event_type="shortlist.updated",
            title="Shortlist updated",
            message=f"Shortlist '{shortlist.title}' was updated.",
            actor=request.user,
            data={"shortlist_id": str(shortlist.shortlist_id), "title": shortlist.title},
        )
        return Response(serializer.data)

    def delete(self, request, shortlist_id):
        if not getattr(request.user, "brand_profile", None):
            return Response({"error": "No brand profile found."}, status=status.HTTP_404_NOT_FOUND)

        shortlist = self.get_shortlist(request, shortlist_id)
        shortlist_title = shortlist.title
        shortlist_pk = str(shortlist.shortlist_id)
        shortlist.delete()
        create_notification(
            recipient=request.user,
            event_type="shortlist.deleted",
            title="Shortlist deleted",
            message=f"Shortlist '{shortlist_title}' was deleted.",
            actor=request.user,
            data={"shortlist_id": shortlist_pk, "title": shortlist_title},
        )
        return Response({"message": "Shortlist deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
    
class BrandProfileViewSet(viewsets.ModelViewSet):
    serializer_class = BrandProfileSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        if self.request.user.role in UserRole.internal_roles():
            return BrandProfile.objects.select_related("user").all()
        if self.request.user.role == UserRole.BRAND:
            return BrandProfile.objects.select_related("user").filter(user=self.request.user)
        return BrandProfile.objects.select_related("user").filter(
            user__verification_status=VerificationStatus.VERIFIED,
            user__is_profile_visible=True,
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
        campaign = serializer.save(brand=self.request.user.brand_profile)
        create_notification(
            recipient=self.request.user,
            event_type="campaign.created",
            title="Campaign created",
            message=f"Campaign '{campaign.title}' was created.",
            actor=self.request.user,
            data={"campaign_id": str(campaign.campaign_id), "title": campaign.title},
        )
        notify_admins(
            event_type="campaign.created",
            title="New campaign created",
            message=f"{campaign.brand.company_name} created campaign '{campaign.title}'.",
            actor=self.request.user,
            data={"campaign_id": str(campaign.campaign_id), "brand_id": str(campaign.brand.brand_id)},
        )

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAuthenticated(), IsBrand()]
        return super().get_permissions()

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, IsCreator])
    def apply(self, request, pk=None):
        campaign = self.get_object()
        application, created = CampaignApplication.objects.update_or_create(
            campaign=campaign,
            creator=request.user.creator_profile,
            defaults={
                "status": ApplicationStatus.APPLIED,
            },
        )
        if created:
            create_notification(
                recipient=request.user,
                event_type="campaign.applied",
                title="Application submitted",
                message=f"You applied to '{campaign.title}'.",
                actor=request.user,
                data={"campaign_id": str(campaign.campaign_id), "application_id": str(application.application_id)},
            )
            create_notification(
                recipient=campaign.brand.user,
                event_type="campaign.application.received",
                title="New campaign application",
                message=f"{request.user.creator_profile.display_name} applied to '{campaign.title}'.",
                actor=request.user,
                data={"campaign_id": str(campaign.campaign_id), "application_id": str(application.application_id)},
            )
            notify_admins(
                event_type="campaign.application.received",
                title="Creator applied to campaign",
                message=f"{request.user.creator_profile.display_name} applied to '{campaign.title}'.",
                actor=request.user,
                data={"campaign_id": str(campaign.campaign_id), "application_id": str(application.application_id)},
            )
        serializer = CampaignApplicationSerializer(application, context={"request": request})
        return Response({"application": serializer.data}, status=status.HTTP_201_CREATED)


class BrandProfileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_object(self, request):
        return getattr(request.user, "brand_profile", None)

    def get(self, request):
        brand = self.get_object(request)
        if not brand:
            return Response({"error": "No Brand profile found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = BrandProfileSerializer(brand, context={"request": request})
        return Response({"brand": serializer.data})

    def patch(self, request):
        brand = self.get_object(request)
        if not brand:
            return Response(
                {"error": "No brand profile found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = BrandProfileSerializer(
            brand,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        if "is_profile_visible" in request.data:
            visible_value = request.data.get("is_profile_visible")
            brand.user.is_profile_visible = str(visible_value).lower() in {"true", "1", "yes", "on"}
            brand.user.save(update_fields=["is_profile_visible"])

        create_notification(
            recipient=request.user,
            event_type="brand.profile.updated",
            title="Brand profile updated",
            message="Your brand profile changes were saved.",
            actor=request.user,
            data={"brand_id": str(brand.brand_id), "company_name": brand.company_name},
        )
        notify_admins(
            event_type="brand.profile.updated",
            title="Brand profile updated",
            message=f"{brand.company_name} updated its profile.",
            actor=request.user,
            data={"brand_id": str(brand.brand_id), "company_name": brand.company_name},
        )

        return Response(
            {"brand": BrandProfileSerializer(brand, context={"request": request}).data},
            status=status.HTTP_200_OK,
        )


class PublicBrandProfileView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request, brand_id):
        brand = get_object_or_404(
            BrandProfile.objects.select_related("user"),
            brand_id=brand_id,
            user__is_profile_visible=True,
        )

        response = {
            "brand_id": str(brand.brand_id),
            "company_name": brand.company_name,
            "industry": brand.industry,
            "about_brand": brand.about_brand,
            "website": brand.website,
            "company_size": brand.company_size,
            "linkedin_url": brand.linkedin_url,
            "gst_number": brand.gst_number,
            "cin_registration_number": brand.cin_registration_number,
            "year_established": brand.year_established,
            "headquarters_city": brand.headquarters_city,
            "headquarters_state": brand.headquarters_state,
            "headquarters_country": brand.headquarters_country,
            "instagram_url": brand.instagram_url,
            "facebook_url": brand.facebook_url,
            "x_url": brand.x_url,
            "youtube_url": brand.youtube_url,
            "gst_certificate": request.build_absolute_uri(brand.gst_certificate.url) if brand.gst_certificate else None,
            "pan_card": request.build_absolute_uri(brand.pan_card.url) if brand.pan_card else None,
            "company_registration_certificate": request.build_absolute_uri(brand.company_registration_certificate.url) if brand.company_registration_certificate else None,
            "logo": request.build_absolute_uri(brand.logo.url) if brand.logo else None,
            "verified": brand.user.verification_status == VerificationStatus.VERIFIED.value,
            "is_profile_visible": brand.user.is_profile_visible,
            "created_at": brand.created_at,
            "updated_at": brand.updated_at,
        }
        return Response({"brand": response})


class BrandSavedCreatorView(APIView):
    permission_classes = [IsAuthenticated, IsBrand]

    def get_brand(self, request):
        return getattr(request.user, "brand_profile", None)

    def get(self, request):
        brand = self.get_brand(request)

        if not brand:
            return Response(
                {"error": "Brand profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        saved_creators = (
            BrandSavedCreator.objects.select_related("creator", "creator__user")
            .filter(brand=brand)
            .order_by("-created_at")
        )

        data = []
        for saved_creator in saved_creators:
            creator = saved_creator.creator
            data.append(
                {
                    "saved_id": str(saved_creator.saved_id),
                    "saved_at": saved_creator.created_at.isoformat(),
                    "creator": {
                        "id": str(creator.creator_id),
                        "display_name": creator.display_name,
                        "niche": creator.category,
                        "location": creator.location,
                        "bio": creator.bio,
                        "profile_photo": request.build_absolute_uri(creator.profile_image.url) if creator.profile_image else None,
                        "verified": creator.user.verification_status == VerificationStatus.VERIFIED.value,
                        "username": creator.user.username,
                    },
                }
            )

        return Response(
            {
                "creators": data,
                "count": len(data),
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        brand = self.get_brand(request)

        if not brand:
            return Response(
                {"error": "Brand profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        creator_id = request.data.get("creator_id")

        if not creator_id:
            return Response(
                {"creator_id": ["This field is required."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            creator = CreatorProfile.objects.get(creator_id=creator_id)
        except CreatorProfile.DoesNotExist:
            return Response(
                {"error": "Creator not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        _, created = BrandSavedCreator.objects.get_or_create(
            brand=brand,
            creator=creator,
        )

        if created:
            create_notification(
                recipient=request.user,
                event_type="creator.saved",
                title="Creator saved",
                message=f"{creator.display_name} was saved to your brand list.",
                actor=request.user,
                data={"creator_id": str(creator.creator_id), "brand_id": str(brand.brand_id)},
            )
            create_notification(
                recipient=creator.user,
                event_type="creator.saved_by_brand",
                title="Brand saved your profile",
                message=f"{brand.company_name} saved your creator profile.",
                actor=request.user,
                data={"creator_id": str(creator.creator_id), "brand_id": str(brand.brand_id)},
            )

        return Response(
            {
                "message": "saved successfully",
                "saved": True,
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def delete(self, request):
        brand = self.get_brand(request)

        if not brand:
            return Response(
                {"error": "Brand profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        creator_id = request.data.get("creator_id")

        if not creator_id:
            return Response(
                {"creator_id": ["This field is required."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        deleted, _ = BrandSavedCreator.objects.filter(
            brand=brand,
            creator_id=creator_id,
        ).delete()

        return Response(
            {
                "message": "creator removed from saved",
                "saved": False,
                "removed": deleted > 0,
            },
            status=status.HTTP_200_OK,
        )
