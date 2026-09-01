import base64
import hashlib
import json
import secrets
from datetime import timedelta
from urllib.parse import urlencode

import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core import signing
from django.db.models import Q
from django.db import transaction
from django.shortcuts import redirect
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import (
    ApplicationStatus, Campaign, CampaignApplication, CreatorProfile, CreatorSavedCampaign, CreatorSocialAccount, SocialPlatform, UserRole, VerificationStatus,
)
from ..notification import create_notification, notify_admins
from ..permissions import IsCreator,IsBrand
from ..common.services import auth_response, create_user, parse_payload
from .serializers import CreatorProfileSerializer, CreatorRegisterSerializer
from .services import fetch_youtube_analytics, fetch_youtube_videos, sync_youtube_account

User = get_user_model()
INSTAGRAM_AUTH_URL = "https://www.instagram.com/oauth/authorize"
INSTAGRAM_TOKEN_URL = "https://api.instagram.com/oauth/access_token"
INSTAGRAM_LONG_LIVED_TOKEN_URL = "https://graph.instagram.com/access_token"
INSTAGRAM_ME_URL = "https://graph.instagram.com/me"
FACEBOOK_AUTH_URL = "https://www.facebook.com/{version}/dialog/oauth"
FACEBOOK_GRAPH_URL = "https://graph.facebook.com/{version}"
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
YOUTUBE_CHANNELS_URL = "https://www.googleapis.com/youtube/v3/channels"


def campaign_cover_image_url(request, campaign):
    if not campaign.cover_image:
        return ""
    return request.build_absolute_uri(campaign.cover_image.url)
X_AUTH_URL = "https://twitter.com/i/oauth2/authorize"
X_TOKEN_URL = "https://api.twitter.com/2/oauth2/token"
X_ME_URL = "https://api.twitter.com/2/users/me"
MOBILE_UA_MARKERS = ("android", "iphone", "ipad", "ipod", "mobile")


def build_creator_location(country="", state="", district="", city="", postal_code="", street_address=""):
    parts = {
        "country": country,
        "state": state,
        "district": district,
        "city": city,
        "postalCode": postal_code,
        "streetAddress": street_address,
    }
    return " | ".join(
        f"{key}: {str(value).strip()}"
        for key, value in parts.items()
        if str(value).strip()
    )


def creator_address_payload(source):
    country = (source.get("country") or "").strip()
    state = (source.get("state") or "").strip()
    district = (source.get("district") or "").strip()
    city = (source.get("city") or "").strip()
    postal_code = (source.get("postal_code") or source.get("postalCode") or "").strip()
    street_address = (source.get("street_address") or source.get("streetAddress") or "").strip()
    location = (source.get("location") or "").strip() or build_creator_location(
        country=country,
        state=state,
        district=district,
        city=city,
        postal_code=postal_code,
        street_address=street_address,
    )
    return {
        "location": location,
        "country": country,
        "state": state,
        "district": district,
        "city": city,
        "postal_code": postal_code,
        "street_address": street_address,
    }


def creator_address_response(creator):
    return {
        "location": creator.location,
        "country": creator.country,
        "state": creator.state,
        "district": creator.district,
        "city": creator.city,
        "postalCode": creator.postal_code,
        "streetAddress": creator.street_address,
    }


def resolve_oauth_client(request):
    requested_client = (request.query_params.get("client") or "").strip().lower()
    if requested_client in {"app", "web"}:
        return requested_client
    user_agent = (request.META.get("HTTP_USER_AGENT") or "").lower()
    return "app" if any(marker in user_agent for marker in MOBILE_UA_MARKERS) else "web"


def build_client_redirect(route, query_params, client="web"):
    query_string = urlencode({key: value for key, value in query_params.items() if value not in ("", None)})
    if client == "app":
        mobile_base = settings.MOBILE_APP_URL.rstrip("/")
        route_path = route.lstrip("/")
        base = f"{mobile_base}{route_path}" if mobile_base.endswith("://") else f"{mobile_base}/{route_path}"
    else:
        frontend_base = settings.FRONTEND_URL.rstrip("/")
        base = f"{frontend_base}/{route.lstrip('/')}"
    return f"{base}?{query_string}" if query_string else base


class CreatorRegisterView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def post(self, request):
        serializer = CreatorRegisterSerializer(data=parse_payload(request))
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        user = create_user(data["user"], UserRole.CREATOR)
        address = creator_address_payload(data)
        creator = CreatorProfile.objects.create(
            user=user,
            display_name=data.get("display_name") or user.profile_name,
            category=data.get("category", ""),
            **address,
            languages=data.get("languages", []),
            collaboration_preferences=data.get("collaboration_preferences", []),
            bio=data.get("bio", ""),
            about=data.get("about", ""),
            gender=data.get("gender", ""),
            profile_image=data.get("profile_image"),
        )
        CreatorSocialAccount.objects.bulk_create(
            [
                CreatorSocialAccount(
                    creator=creator,
                    platform=account["platform"],
                    handle=account["handle"],
                    url=account.get("url", ""),
                    followers=account.get("followers", 0),
                    is_connected=account.get("is_connected", False),
                )
                for account in data.get("social_accounts", [])
                if account.get("handle")
            ]
        )
        create_notification(
            recipient=user,
            event_type="creator.account.created",
            title="Creator account created",
            message="Your creator account was created successfully.",
            data={"creator_id": str(creator.creator_id), "display_name": creator.display_name},
        )
        notify_admins(
            event_type="creator.account.created",
            title="New creator registration",
            message=f"{creator.display_name} joined the platform.",
            actor=user,
            data={"creator_id": str(creator.creator_id), "display_name": creator.display_name},
        )
        return Response(
            {
                **auth_response(user, "Creator account created."),
                "creator": CreatorProfileSerializer(creator, context={"request": request}).data,
            },
            status=status.HTTP_201_CREATED,
        )
    
class CreatorDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsCreator]

    chart_period_days = {
        "7d": 7,
        "30d": 30,
        "90d": 90,
    }

    def get_profile_completion(self, creator):
        checks = [
            bool(creator.display_name.strip()),
            bool(creator.category.strip()),
            bool(creator.location.strip()),
            bool(creator.languages),
            bool(creator.collaboration_preferences),
            bool(creator.bio.strip()),
            bool(getattr(creator, "about", "").strip()),
            bool(creator.profile_image),
            creator.social_accounts.filter(is_connected=True).exists(),
        ]
        completion = round((sum(checks) / len(checks)) * 100)

        if creator.profile_completion != completion:
            creator.profile_completion = completion
            creator.save(update_fields=["profile_completion"])

        return completion

    def get_campaign_score(self, creator, campaign):
        creator_terms = {
            creator.category,
            creator.location,
            creator.bio,
            getattr(creator, "about", ""),
            *creator.languages,
            *creator.collaboration_preferences,
        }
        normalized_terms = {
            str(term).strip().lower()
            for term in creator_terms
            if str(term).strip()
        }

        requirement_text = (campaign.brand_requirements or "").lower()
        score = sum(1 for term in normalized_terms if term in requirement_text)
        if campaign.category and campaign.category.strip().lower() == creator.category.strip().lower():
            score += 3
        if campaign.location and campaign.location.strip().lower() == creator.location.strip().lower():
            score += 2
        return score

    def get_ranked_campaigns(self, creator):
        campaigns = Campaign.objects.all().order_by("-created_at")
        return sorted(campaigns, key=lambda campaign: self.get_campaign_score(creator, campaign), reverse=True)

    def get_matching_campaigns(self, creator):
        ranked_campaigns = self.get_ranked_campaigns(creator)[:3]

        return [
            {
                "id": str(campaign.campaign_id),
                "title": campaign.title,
                "objective": campaign.objective,
                "cover_image": campaign_cover_image_url(self.request, campaign),
                "deadline": campaign.deadline.isoformat() if campaign.deadline else None,
                "looking_for": campaign.category or campaign.brand_requirements,
                "applied": CampaignApplication.objects.filter(campaign=campaign, creator=creator).exists(),
                "saved": CreatorSavedCampaign.objects.filter(campaign=campaign, creator=creator).exists(),
            }
            for campaign in ranked_campaigns
        ]

    def get_recommended_campaign_chart(self, request, creator):
        period = request.query_params.get("period", "7d")
        days = self.chart_period_days.get(period, self.chart_period_days["7d"])
        today = timezone.localdate()
        start_date = today - timedelta(days=days - 1)
        buckets = {
            start_date + timedelta(days=index): 0
            for index in range(days)
        }

        for campaign in self.get_ranked_campaigns(creator):
            campaign_date = timezone.localtime(campaign.created_at).date()
            if start_date <= campaign_date <= today:
                buckets[campaign_date] += 1

        return [
            {
                "date": bucket_date.isoformat(),
                "label": bucket_date.strftime("%d %b"),
                "recommended_campaigns": count,
            }
            for bucket_date, count in buckets.items()
        ]

    def get(self, request, profile_verified=False):
        creator = getattr(request.user, "creator_profile", None)
        if not creator:
            return Response({"error": "No creator profile found."}, status=status.HTTP_404_NOT_FOUND)

        profile_completion = self.get_profile_completion(creator)
        social_media_connected = creator.social_accounts.filter(is_connected=True).exists()
        profile_verified = profile_verified or request.user.verification_status == VerificationStatus.VERIFIED

        if profile_verified:
            data = {
                "connected_platforms": creator.social_accounts.filter(is_connected=True).count(),
                "campaign_applications": creator.applications.count(),
                "profile_completion": profile_completion,
                "campaigns": self.get_matching_campaigns(creator),
                "recommended_campaigns_chart": self.get_recommended_campaign_chart(request, creator),

            }
            return Response({"creator": data})
        
        data = {
            "account_id": str(creator.creator_id),
            "account_created": bool(creator.created_at),
            "social_media_connected": social_media_connected,
            "verification_status": request.user.verification_status,
            "profile_completion": profile_completion,

        }
        return Response({"creator": data})
    
class CampaignsListView(APIView):
    permission_classes = [IsAuthenticated, IsCreator]

    def get(self, request):
        page = max(int(request.query_params.get("page", 1) or 1), 1)
        page_size = min(max(int(request.query_params.get("page_size", 6) or 6), 1), 24)
        search = (request.query_params.get("search") or "").strip()
        sort = request.query_params.get("sort") or "recent"

        campaigns = Campaign.objects.select_related("brand")

        if search:
            campaigns = campaigns.filter(
                Q(title__icontains=search)
                | Q(objective__icontains=search)
                | Q(brand__company_name__icontains=search)
            )

        if sort == "deadline":
            campaigns = campaigns.order_by("deadline", "-created_at")
        elif sort == "brand":
            campaigns = campaigns.order_by("brand__company_name", "-created_at")
        else:
            campaigns = campaigns.order_by("-created_at")

        total_count = campaigns.count()
        start = (page - 1) * page_size
        end = start + page_size
        page_campaigns = campaigns[start:end]

        data = [
            {
                "id": str(campaign.campaign_id),
                "brand_id": str(campaign.brand.brand_id),
                "title": campaign.title,
                "objective": campaign.objective,
                "deadline": campaign.deadline.isoformat() if campaign.deadline else None,
                "posted_at": campaign.created_at.isoformat(),
                "brand_name": campaign.brand.company_name,
                "brand_logo": request.build_absolute_uri(campaign.brand.logo.url) if campaign.brand.logo else None,
                "applied": CampaignApplication.objects.filter(campaign=campaign, creator=request.user.creator_profile).exists(),
                "saved": CreatorSavedCampaign.objects.filter(campaign=campaign, creator=request.user.creator_profile).exists(),
            }
            for campaign in page_campaigns
        ]
        return Response({
            "campaigns": data,
            "count": total_count,
            "page": page,
            "page_size": page_size,
            "total_pages": max((total_count + page_size - 1) // page_size, 1),
        })
    
class CreatorCampaignsView(APIView):
    permission_classes = [IsAuthenticated, IsCreator]

    def get(self, request, campaign_id=None):

        campaign = Campaign.objects.select_related("brand").filter(
            campaign_id=campaign_id,
        ).first()
        if not campaign:
            return Response({"error": "Campaign not found."}, status=status.HTTP_404_NOT_FOUND)
        applied = CampaignApplication.objects.filter(
            campaign=campaign,
            creator=getattr(request.user, "creator_profile", None),
        ).exists()
        saved = CreatorSavedCampaign.objects.filter(
            campaign=campaign,
            creator=getattr(request.user, "creator_profile", None),
        ).exists()
        data = {
            "id": str(campaign.campaign_id),
            "brand_id": str(campaign.brand.brand_id),
            "title": campaign.title,
            "brief": campaign.brief,
            "objective": campaign.objective,
            "deliverables": campaign.deliverables,
            "creative_direction": campaign.creative_direction,
            "platforms": campaign.platforms,
            "category": campaign.category,
            "audience_type": campaign.audience_type,
            "location": campaign.location,
            "minimum_followers": campaign.minimum_followers,
            "language_preference": campaign.language_preference,
            "content_style": campaign.content_style,
            "brand_requirements": campaign.brand_requirements,
            "start_date": campaign.start_date.isoformat() if campaign.start_date else None,
            "end_date": campaign.end_date.isoformat() if campaign.end_date else None,
            "deadline": campaign.deadline.isoformat() if campaign.deadline else None,
            "cover_image": campaign_cover_image_url(request, campaign),
            "posted_at": campaign.created_at.isoformat(),
            "brand_name": campaign.brand.company_name,
            "brand_type": campaign.brand.industry,
            "brand_logo": request.build_absolute_uri(campaign.brand.logo.url) if campaign.brand.logo else None,
            "creator_requirements": {
                "looking_for": campaign.category or campaign.brand_requirements,
                "audience": campaign.audience_type,
                "minimum_followers": campaign.minimum_followers,
                "languages": campaign.language_preference,
                "location": campaign.location,
                "content_style": campaign.content_style,
            },
            "applied": applied,
            "saved": saved

        }
        return Response({"campaign": data})
    
class CreatorProfileView(APIView):
    permission_classes = [IsAuthenticated,IsCreator]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_object(self, request):
        return getattr(request.user, "creator_profile", None)

    def get(self, request):
        creator = self.get_object(request)
        if not creator:
            return Response({"error": "No creator profile found."}, status=status.HTTP_404_NOT_FOUND)

        platforms = []
        total_followers = 0
        total_views = 0
        total_media = 0
        total_engagement = 0

        for account in creator.social_accounts.all():
            total_followers += account.followers
            total_views += account.view_count
            total_media += account.media_count
            total_engagement += account.engagement_rate

            item = {
                "name": account.platform,
                "followers": account.followers,
                "engagement_rate": account.engagement_rate,
                "view_count": account.view_count,
                "media_count": account.media_count,
                "provider_data":account.provider_data,
                    "analytics": account.analytics,
                    "url": account.url,
            }
            platforms.append(item)

        response = {
            "creator_id": str(creator.creator_id),
            "display_name": creator.display_name,
            "category": creator.category,
            "verified": creator.user.verification_status
            == VerificationStatus.VERIFIED.value,
            "username": creator.user.username,
            "profile_image": (
                request.build_absolute_uri(creator.profile_image.url)
                if creator.profile_image
                else None
            ),
            "updated_at": creator.updated_at,
            "languages": creator.languages,
            "bio": creator.bio,
            "about": creator.about,
            "gender": creator.gender,
            "is_profile_visible": creator.user.is_profile_visible,
            "total_followers": total_followers,
            "platform_data": platforms,
            "avg_eng_rate": (
                        round(total_engagement / len(platforms), 2)
                        if platforms
                        else 0
                    ),
            "total_view_count": total_views,
            "total_media_count": total_media,
            "work_with":creator.work_with,
            "collaboration_preferences":creator.collaboration_preferences
        }
        response.update(creator_address_response(creator))

        return Response({"creator": response})

    def patch(self, request):
        creator = self.get_object(request)

        if not creator:
            return Response(
                {"error": "No creator profile found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        allowed_creator_fields = {
            "about",
            "bio",
            "category",
            "gender",
            "location",
            "languages",
            "collaboration_preferences",
            "work_with",
        }
        address_keys = {"country", "state", "district", "city", "postalCode", "streetAddress", "postal_code", "street_address"}

        # Update CreatorProfile fields
        for field in allowed_creator_fields:
            if field in request.data:
                value = request.data.get(field)
                if field in {"work_with", "languages", "collaboration_preferences"} and isinstance(value, str):
                    try:
                        parsed_value = json.loads(value)
                        value = parsed_value if isinstance(parsed_value, list) else []
                    except json.JSONDecodeError:
                        value = [item.strip() for item in value.split(",") if item.strip()]
                setattr(creator, field, value)

        if "location" in request.data or any(key in request.data for key in address_keys):
            address = creator_address_payload(request.data)
            for field, value in address.items():
                setattr(creator, field, value)

        # Update profile image
        if "profile_image" in request.FILES:
            creator.profile_image = request.FILES["profile_image"]

        creator.save()

        # Update User phone number
        if "phone_no" in request.data:
            creator.user.phone_no = request.data.get("phone_no")
            creator.user.save(update_fields=["phone_no"])

        if "is_profile_visible" in request.data:
            visible_value = request.data.get("is_profile_visible")
            creator.user.is_profile_visible = str(visible_value).lower() in {"true", "1", "yes", "on"}
            creator.user.save(update_fields=["is_profile_visible"])

        create_notification(
            recipient=request.user,
            event_type="creator.profile.updated",
            title="Creator profile updated",
            message="Your creator profile changes were saved.",
            actor=request.user,
            data={"creator_id": str(creator.creator_id), "display_name": creator.display_name},
        )
        notify_admins(
            event_type="creator.profile.updated",
            title="Creator profile updated",
            message=f"{creator.display_name} updated the creator profile.",
            actor=request.user,
            data={"creator_id": str(creator.creator_id), "display_name": creator.display_name},
        )

        return Response(
            {
                "message": "Profile updated successfully.",
            },
            status=status.HTTP_200_OK,
        )

class CampaignApplicationViewSet(APIView):
    permission_classes = [IsAuthenticated,IsCreator]

    def get_creator(self, request):
        return getattr(request.user, "creator_profile", None)

    def post(self, request):
        creator = self.get_creator(request)

        if not creator:
            return Response(
                {"error": "Creator profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        campaign_id = request.data.get("campaign_id")

        if not campaign_id:
            return Response(
                {"campaign_id": ["This field is required."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            campaign = Campaign.objects.get(campaign_id=campaign_id)
        except Campaign.DoesNotExist:
            return Response(
                {"error": "Campaign not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        application, created = CampaignApplication.objects.get_or_create(
            campaign=campaign,
            creator=creator,
            defaults={
                "pitch": request.data.get("pitch", ""),
                "quoted_rate": request.data.get("quoted_rate", 0) or 0,
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
                message=f"{creator.display_name} applied to '{campaign.title}'.",
                actor=request.user,
                data={"campaign_id": str(campaign.campaign_id), "application_id": str(application.application_id)},
            )
            notify_admins(
                event_type="campaign.application.received",
                title="Creator applied to campaign",
                message=f"{creator.display_name} applied to '{campaign.title}'.",
                actor=request.user,
                data={"campaign_id": str(campaign.campaign_id), "application_id": str(application.application_id)},
            )

        return Response(
            {
                "massage":"sucussfully created"
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def delete(self, request):
        creator = self.get_creator(request)

        if not creator:
            return Response(
                {"error": "Creator profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        campaign_id = request.data.get("campaign_id")

        if not campaign_id:
            return Response(
                {"campaign_id": ["This field is required."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        campaign = Campaign.objects.filter(campaign_id=campaign_id).select_related("brand__user").first()
        deleted, _ = CampaignApplication.objects.filter(
            campaign_id=campaign_id,
            creator=creator,
        ).delete()

        if deleted and campaign:
            create_notification(
                recipient=request.user,
                event_type="campaign.application.withdrawn",
                title="Application withdrawn",
                message=f"You withdrew from '{campaign.title}'.",
                actor=request.user,
                data={"campaign_id": str(campaign.campaign_id)},
            )
            create_notification(
                recipient=campaign.brand.user,
                event_type="campaign.application.withdrawn",
                title="Application withdrawn",
                message=f"{creator.display_name} withdrew from '{campaign.title}'.",
                actor=request.user,
                data={"campaign_id": str(campaign.campaign_id)},
            )

        return Response(
            {
                "message": "application removed",
                "removed": deleted > 0,
            },
            status=status.HTTP_200_OK,
        )
    
class CreatorSavedCampaignView(APIView):
    permission_classes = [IsAuthenticated, IsCreator]

    def get_creator(self, request):
        return getattr(request.user, "creator_profile", None)

    def get(self, request):
        creator = self.get_creator(request)

        if not creator:
            return Response(
                {"error": "Creator profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        saved_campaigns = (
            CreatorSavedCampaign.objects.select_related("campaign", "campaign__brand")
            .filter(creator=creator)
            .order_by("-created_at")
        )

        data = []
        for saved_campaign in saved_campaigns:
            campaign = saved_campaign.campaign
            brand = campaign.brand
            data.append(
                {
                    "saved_id": str(saved_campaign.saved_id),
                    "saved_at": saved_campaign.created_at.isoformat(),
                    "campaign": {
                        "id": str(campaign.campaign_id),
                        "title": campaign.title,
                        "objective": campaign.objective,
                        "deadline": campaign.deadline.isoformat() if campaign.deadline else None,
                        "posted_at": campaign.created_at.isoformat(),
                        "cover_image": campaign_cover_image_url(request, campaign),
                        "brand_id": str(brand.brand_id),
                        "brand_name": brand.company_name,
                        "brand_type": brand.industry,
                        "brand_logo": request.build_absolute_uri(brand.logo.url) if brand.logo else None,
                    },
                }
            )

        return Response(
            {
                "campaigns": data,
                "count": len(data),
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        creator = self.get_creator(request)

        if not creator:
            return Response(
                {"error": "Creator profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        campaign_id = request.data.get("campaign_id")

        if not campaign_id:
            return Response(
                {"campaign_id": ["This field is required."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            campaign = Campaign.objects.get(campaign_id=campaign_id)
        except Campaign.DoesNotExist:
            return Response(
                {"error": "Campaign not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        _, created = CreatorSavedCampaign.objects.get_or_create(
            campaign=campaign,
            creator=creator,
        )

        if created:
            create_notification(
                recipient=request.user,
                event_type="campaign.saved",
                title="Campaign saved",
                message=f"'{campaign.title}' was saved to your list.",
                actor=request.user,
                data={"campaign_id": str(campaign.campaign_id)},
            )

        return Response(
            {
                "message": "saved successfully",
                "saved": True,
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def delete(self, request):
        creator = self.get_creator(request)

        if not creator:
            return Response(
                {"error": "Creator profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        campaign_id = request.data.get("campaign_id")

        if not campaign_id:
            return Response(
                {"campaign_id": ["This field is required."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        deleted, _ = CreatorSavedCampaign.objects.filter(
            campaign_id=campaign_id,
            creator=creator,
        ).delete()

        return Response(
            {
                "message": "campaign removed from saved",
                "saved": False,
                "removed": deleted > 0,
            },
            status=status.HTTP_200_OK,
        )

class CreatorAppliedCampaignsView(APIView):
    permission_classes = [IsAuthenticated, IsCreator]

    def get_creator(self, request):
        return getattr(request.user, "creator_profile", None)

    def get(self, request):
        creator = self.get_creator(request)

        if not creator:
            return Response(
                {"error": "Creator profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        applications = (
            CampaignApplication.objects.select_related("campaign", "campaign__brand")
            .filter(
                creator=creator,
                status__in=[ApplicationStatus.APPLIED, ApplicationStatus.ACCEPTED],
            )
            .order_by("-updated_at", "-created_at")
        )

        data = []
        for application in applications:
            campaign = application.campaign
            brand = campaign.brand
            data.append(
                {
                    "application_id": str(application.application_id),
                    "application_status": application.status,
                    "applied_at": application.created_at.isoformat(),
                    "updated_at": application.updated_at.isoformat(),
                    "campaign": {
                        "id": str(campaign.campaign_id),
                        "title": campaign.title,
                        "objective": campaign.objective,
                        "deadline": campaign.deadline.isoformat() if campaign.deadline else None,
                        "posted_at": campaign.created_at.isoformat(),
                        "cover_image": campaign_cover_image_url(request, campaign),
                        "brand_id": str(brand.brand_id),
                        "brand_name": brand.company_name,
                        "brand_type": brand.industry,
                        "brand_logo": request.build_absolute_uri(brand.logo.url) if brand.logo else None,
                    },
                }
            )

        return Response(
            {
                "campaigns": data,
                "count": len(data),
            },
            status=status.HTTP_200_OK,
        )

class CreatorListViewSet(APIView):
    permission_classes = [AllowAny]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request, creator_id=None):
        is_brand = (
            request.user.is_authenticated
            and getattr(request.user, "role", "") == UserRole.BRAND
        )

        if creator_id:
            return self.get_creator_detail(request, creator_id, is_brand)

        return self.get_creator_list(request, is_brand)

    def get_creator_detail(self, request, creator_id, is_brand):
        try:
            creator = (
                CreatorProfile.objects.select_related("user")
                .prefetch_related("social_accounts")
                .get(
                    creator_id=creator_id,
                    user__is_profile_visible=True,
                )
            )
        except CreatorProfile.DoesNotExist:
            return Response(
                {"error": "Creator profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        platforms = []
        total_followers = 0
        total_views = 0
        total_media = 0
        total_engagement = 0

        for account in creator.social_accounts.all():
            total_followers += account.followers
            total_views += account.view_count
            total_media += account.media_count
            total_engagement += account.engagement_rate

            item = {
                "name": account.platform,
                "followers": account.followers,
            }

            if is_brand:
                item.update(
                    {
                        "engagement_rate": account.engagement_rate,
                        "view_count": account.view_count,
                        "media_count": account.media_count,
                    }
                )

            platforms.append(item)

        response = {
            "creator_id": str(creator.creator_id),
            "display_name": creator.display_name,
            "category": creator.category,
            "verified": creator.user.verification_status
            == VerificationStatus.VERIFIED.value,
            "username": creator.user.username,
            "profile_image": (
                request.build_absolute_uri(creator.profile_image.url)
                if creator.profile_image
                else None
            ),
            "updated_at": creator.updated_at,
            "languages": creator.languages,
            "bio": creator.bio,
            "about": creator.about,
            "gender": creator.gender,
            "collaboration_preferences": creator.collaboration_preferences,
            "total_followers": total_followers,
            "platform_data": platforms,
        }
        response.update(creator_address_response(creator))

        if is_brand:
            response.update(
                {
                    "avg_eng_rate": (
                        round(total_engagement / len(platforms), 2)
                        if platforms
                        else 0
                    ),
                    "total_view_count": total_views,
                    "total_media_count": total_media,
                }
            )

        return Response({"creator": response})

    def get_creator_list(self, request, is_brand):
        creators = (
            CreatorProfile.objects.select_related("user")
            .prefetch_related("social_accounts")
            .order_by("-created_at")
        )

        data = []

        for creator in creators:
            total_followers = sum(
                account.followers for account in creator.social_accounts.all()
            )

            is_profile_visible = creator.user.is_profile_visible
            item = {
                "creator_id": str(creator.creator_id) if is_profile_visible else None,
                "display_name": creator.display_name,
                "category": creator.category,
                "verified": creator.user.verification_status
                == VerificationStatus.VERIFIED.value,
                "username": creator.user.username,
                "profile_image": (
                    request.build_absolute_uri(creator.profile_image.url)
                    if creator.profile_image
                    else None
                ),
                "work_with": creator.work_with,
                "total_followers": total_followers,
                "is_profile_visible": is_profile_visible,
                "created_at": creator.created_at.isoformat(),
            }
            item.update(creator_address_response(creator))
            item["gender"] = creator.gender

            data.append(item)

        return Response({"creators": data})

class InstagramConnectView(APIView):
    permission_classes = [IsAuthenticated, IsCreator]

    def get(self, request):
        if not settings.INSTAGRAM_CLIENT_ID or not settings.INSTAGRAM_CLIENT_SECRET:
            return Response(
                {"error": "Instagram OAuth is not configured. Set INSTAGRAM_CLIENT_ID and INSTAGRAM_CLIENT_SECRET."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        client = resolve_oauth_client(request)
        state = signing.dumps(
            {
                "user_id": str(request.user.user_id),
                "nonce": secrets.token_urlsafe(16),
                "client": client,
                "return_to": "registration" if request.query_params.get("return_to") == "registration" else "",
            },
            salt="instagram-oauth",
        )
        params = {
            "client_id": settings.INSTAGRAM_CLIENT_ID,
            "redirect_uri": settings.INSTAGRAM_REDIRECT_URI,
            "scope": settings.INSTAGRAM_OAUTH_SCOPES,
            "response_type": "code",
            "state": state,
            "enable_fb_login": "0",
            "force_authentication": "1",
        }
        return Response({
            "auth_url": f"{INSTAGRAM_AUTH_URL}?{urlencode(params)}",
            "redirect_uri": settings.INSTAGRAM_REDIRECT_URI,
        })

class InstagramCallbackView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        code = request.query_params.get("code")
        state = request.query_params.get("state")

        def instagram_error(reason, registration=False, client="web"):
            route = "creator-register" if registration else "creator/profile"
            return redirect(build_client_redirect(route, {"social_step": 1, "instagram": "error", "instagram_reason": reason}, client))

        if not code or not state:
            return instagram_error("missing_code")

        try:
            state_data = signing.loads(state, salt="instagram-oauth", max_age=600)
            user = User.objects.get(user_id=state_data["user_id"], role=UserRole.CREATOR)
            creator = user.creator_profile
            redirect_client = state_data.get("client", "web")
            registration_return = state_data.get("return_to") == "registration"
        except (signing.BadSignature, signing.SignatureExpired, User.DoesNotExist, CreatorProfile.DoesNotExist, KeyError):
            return instagram_error("state")

        token_response = requests.post(
            INSTAGRAM_TOKEN_URL,
            data={
                "client_id": settings.INSTAGRAM_CLIENT_ID,
                "client_secret": settings.INSTAGRAM_CLIENT_SECRET,
                "grant_type": "authorization_code",
                "redirect_uri": settings.INSTAGRAM_REDIRECT_URI,
                "code": code,
            },
            timeout=20,
        )
        if not token_response.ok:
            return instagram_error("token", registration_return, redirect_client)

        token_data = token_response.json()
        access_token = token_data.get("access_token", "")
        if not access_token:
            return instagram_error("token", registration_return, redirect_client)
        instagram_user_id = token_data.get("user_id") or token_data.get("id") or ""
        expires_at = None

        long_token_response = requests.get(
            INSTAGRAM_LONG_LIVED_TOKEN_URL,
            params={
                "grant_type": "ig_exchange_token",
                "client_secret": settings.INSTAGRAM_CLIENT_SECRET,
                "access_token": access_token,
            },
            timeout=20,
        )
        if long_token_response.ok:
            long_token_data = long_token_response.json()
            access_token = long_token_data.get("access_token", access_token)
            expires_in = long_token_data.get("expires_in")
            if expires_in:
                expires_at = timezone.now() + timedelta(seconds=int(expires_in))

        profile_response = requests.get(
            INSTAGRAM_ME_URL,
            params={
                "fields": "user_id,username,account_type,followers_count,media_count",
                "access_token": access_token,
            },
            timeout=20,
        )
        if not profile_response.ok:
            return instagram_error("profile", registration_return, redirect_client)

        profile_data = profile_response.json()
        social_id = str(profile_data.get("user_id") or profile_data.get("id") or instagram_user_id)
        username = profile_data.get("username", "")
        followers = int(profile_data.get("followers_count") or 0)
        media_count = int(profile_data.get("media_count") or 0)

        account, _ = CreatorSocialAccount.objects.update_or_create(
            creator=creator,
            platform=SocialPlatform.INSTAGRAM,
            defaults={
                "social_id": social_id,
                "username": username,
                "handle": username,
                "url": f"https://www.instagram.com/{username}/" if username else "",
                "followers": followers,
                "media_count": media_count,
                "access_token": access_token,
                "expires_at": expires_at,
                "is_connected": True,
                "last_synced_at": timezone.now(),
            },
        )
        creator.save(update_fields=["updated_at"])

        if registration_return:
            return redirect(build_client_redirect("creator-register", {"social_step": 1, "instagram": "connected", "account": account.account_id}, redirect_client))
        return redirect(build_client_redirect("creator/profile", {"instagram": "connected", "account": account.account_id}, redirect_client))

class FacebookConnectView(APIView):
    permission_classes = [IsAuthenticated, IsCreator]

    def get(self, request):
        if not settings.FACEBOOK_APP_ID or not settings.FACEBOOK_APP_SECRET:
            return Response(
                {"error": "Facebook OAuth is not configured. Set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        client = resolve_oauth_client(request)
        state = signing.dumps(
            {
                "user_id": str(request.user.user_id),
                "nonce": secrets.token_urlsafe(16),
                "client": client,
                "return_to": "registration" if request.query_params.get("return_to") == "registration" else "",
            },
            salt="facebook-oauth",
        )
        params = {
            "client_id": settings.FACEBOOK_APP_ID,
            "redirect_uri": settings.FACEBOOK_REDIRECT_URI,
            "scope": settings.FACEBOOK_OAUTH_SCOPES,
            "response_type": "code",
            "state": state,
        }
        auth_url = FACEBOOK_AUTH_URL.format(version=settings.FACEBOOK_GRAPH_VERSION)
        return Response({"auth_url": f"{auth_url}?{urlencode(params)}"})

class FacebookCallbackView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        code = request.query_params.get("code")
        state = request.query_params.get("state")

        def facebook_error(reason, registration=False, client="web"):
            route = "creator-register" if registration else "creator/profile"
            return redirect(build_client_redirect(route, {"social_step": 1, "facebook": "error", "facebook_reason": reason}, client))

        if not code or not state:
            return facebook_error("missing_code")

        try:
            state_data = signing.loads(state, salt="facebook-oauth", max_age=600)
            user = User.objects.get(user_id=state_data["user_id"], role=UserRole.CREATOR)
            creator = user.creator_profile
            redirect_client = state_data.get("client", "web")
            registration_return = state_data.get("return_to") == "registration"
        except (signing.BadSignature, signing.SignatureExpired, User.DoesNotExist, CreatorProfile.DoesNotExist, KeyError):
            return facebook_error("state")

        graph_url = FACEBOOK_GRAPH_URL.format(version=settings.FACEBOOK_GRAPH_VERSION)
        token_response = requests.get(
            f"{graph_url}/oauth/access_token",
            params={
                "client_id": settings.FACEBOOK_APP_ID,
                "client_secret": settings.FACEBOOK_APP_SECRET,
                "redirect_uri": settings.FACEBOOK_REDIRECT_URI,
                "code": code,
            },
            timeout=20,
        )
        if not token_response.ok:
            return facebook_error("token", registration_return, redirect_client)

        token_data = token_response.json()
        access_token = token_data.get("access_token", "")
        if not access_token:
            return facebook_error("token", registration_return, redirect_client)
        expires_at = None
        expires_in = token_data.get("expires_in")
        if expires_in:
            expires_at = timezone.now() + timedelta(seconds=int(expires_in))

        long_token_response = requests.get(
            f"{graph_url}/oauth/access_token",
            params={
                "grant_type": "fb_exchange_token",
                "client_id": settings.FACEBOOK_APP_ID,
                "client_secret": settings.FACEBOOK_APP_SECRET,
                "fb_exchange_token": access_token,
            },
            timeout=20,
        )
        if long_token_response.ok:
            long_token_data = long_token_response.json()
            access_token = long_token_data.get("access_token", access_token)
            long_expires_in = long_token_data.get("expires_in")
            if long_expires_in:
                expires_at = timezone.now() + timedelta(seconds=int(long_expires_in))

        profile_response = requests.get(
            f"{graph_url}/me",
            params={
                "fields": "id,name,email,picture.type(large)",
                "access_token": access_token,
            },
            timeout=20,
        )
        if not profile_response.ok:
            return facebook_error("profile", registration_return, redirect_client)

        profile_data = profile_response.json()
        pages = []
        pages_response = requests.get(
            f"{graph_url}/me/accounts",
            params={
                "fields": "id,name,link,fan_count,followers_count,picture.type(large)",
                "access_token": access_token,
            },
            timeout=20,
        )
        if pages_response.ok:
            pages = pages_response.json().get("data", [])

        primary_page = pages[0] if pages else {}
        followers = int(primary_page.get("followers_count") or primary_page.get("fan_count") or 0)
        facebook_id = str(profile_data.get("id", ""))
        name = profile_data.get("name", "")
        picture_url = profile_data.get("picture", {}).get("data", {}).get("url", "")
        page_picture_url = primary_page.get("picture", {}).get("data", {}).get("url", "")

        account, _ = CreatorSocialAccount.objects.update_or_create(
            creator=creator,
            platform=SocialPlatform.FACEBOOK,
            defaults={
                "social_id": facebook_id,
                "username": name,
                "handle": name,
                "url": primary_page.get("link") or (f"https://www.facebook.com/{facebook_id}" if facebook_id else ""),
                "followers": followers,
                "media_count": len(pages),
                "access_token": access_token,
                "expires_at": expires_at,
                "is_connected": True,
                "last_synced_at": timezone.now(),
                "provider_data": {
                    "id": facebook_id,
                    "name": name,
                    "email": profile_data.get("email", ""),
                    "profile_picture_url": picture_url,
                    "primary_page_id": primary_page.get("id", ""),
                    "primary_page_name": primary_page.get("name", ""),
                    "primary_page_picture_url": page_picture_url,
                    "pages": pages,
                },
            },
        )
        creator.save(update_fields=["updated_at"])

        if registration_return:
            return redirect(build_client_redirect("creator-register", {"social_step": 1, "facebook": "connected", "account": account.account_id}, redirect_client))
        return redirect(build_client_redirect("creator/profile", {"facebook": "connected", "account": account.account_id}, redirect_client))

class YouTubeConnectView(APIView):
    permission_classes = [IsAuthenticated, IsCreator]

    def get(self, request):
        if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
            return Response(
                {"error": "YouTube OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        client = resolve_oauth_client(request)
        state = signing.dumps(
            {
                "user_id": str(request.user.user_id),
                "nonce": secrets.token_urlsafe(16),
                "client": client,
                "return_to": "registration" if request.query_params.get("return_to") == "registration" else "",
            },
            salt="youtube-oauth",
        )
        params = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": settings.YOUTUBE_REDIRECT_URI,
            "response_type": "code",
            "access_type": "offline",
            "prompt": "consent",
            "scope": settings.YOUTUBE_OAUTH_SCOPES,
            "state": state,
        }
        return Response({"auth_url": f"{GOOGLE_AUTH_URL}?{urlencode(params)}"})

class YouTubeCallbackView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        code = request.query_params.get("code")
        state = request.query_params.get("state")

        def youtube_redirect(status_value, registration=False, client="web"):
            route = "creator-register" if registration else "creator/profile"
            params = {"social_step": 1, "youtube": status_value} if registration else {"youtube": status_value}
            return redirect(build_client_redirect(route, params, client))

        if not code or not state:
            return youtube_redirect("error")

        try:
            state_data = signing.loads(state, salt="youtube-oauth", max_age=600)
            user = User.objects.get(user_id=state_data["user_id"], role=UserRole.CREATOR)
            creator = user.creator_profile
            redirect_client = state_data.get("client", "web")
            registration_return = state_data.get("return_to") == "registration"
        except (signing.BadSignature, signing.SignatureExpired, User.DoesNotExist, CreatorProfile.DoesNotExist, KeyError):
            return youtube_redirect("error")

        token_response = requests.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": settings.YOUTUBE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
            timeout=20,
        )
        if not token_response.ok:
            return youtube_redirect("error", registration_return, redirect_client)

        token_data = token_response.json()
        access_token = token_data.get("access_token", "")
        refresh_token = token_data.get("refresh_token", "")
        expires_at = None
        expires_in = token_data.get("expires_in")
        if expires_in:
            expires_at = timezone.now() + timedelta(seconds=int(expires_in))

        channel_response = requests.get(
            YOUTUBE_CHANNELS_URL,
            headers={"Authorization": f"Bearer {access_token}"},
            params={"part": "snippet,statistics,contentDetails", "mine": "true"},
            timeout=20,
        )
        if not channel_response.ok:
            return youtube_redirect("error", registration_return, redirect_client)

        channel_data = channel_response.json()
        items = channel_data.get("items", [])
        if not items:
            return youtube_redirect("no_channel", registration_return, redirect_client)

        channel = items[0]
        snippet = channel.get("snippet", {})
        statistics = channel.get("statistics", {})
        content_details = channel.get("contentDetails", {})
        uploads_playlist_id = content_details.get("relatedPlaylists", {}).get("uploads", "")
        channel_id = channel.get("id", "")
        title = snippet.get("title", "")
        custom_url = snippet.get("customUrl", "")
        subscribers = int(statistics.get("subscriberCount") or 0)
        videos = int(statistics.get("videoCount") or 0)
        views = int(statistics.get("viewCount") or 0)
        thumbnails = snippet.get("thumbnails", {})
        thumbnail_url = (
            thumbnails.get("high", {}).get("url")
            or thumbnails.get("medium", {}).get("url")
            or thumbnails.get("default", {}).get("url")
            or ""
        )
        youtube_videos = fetch_youtube_videos(access_token, uploads_playlist_id)
        youtube_analytics = fetch_youtube_analytics(access_token)
        existing_account = CreatorSocialAccount.objects.filter(
            creator=creator,
            platform=SocialPlatform.YOUTUBE,
        ).first()

        account, _ = CreatorSocialAccount.objects.update_or_create(
            creator=creator,
            platform=SocialPlatform.YOUTUBE,
            defaults={
                "social_id": channel_id,
                "username": custom_url or title,
                "handle": title,
                "url": f"https://www.youtube.com/channel/{channel_id}" if channel_id else "",
                "followers": subscribers,
                "media_count": videos,
                "view_count": views,
                "video_count": videos,
                "videos": youtube_videos,
                "analytics": youtube_analytics,
                "access_token": access_token,
                "refresh_token": refresh_token or (existing_account.refresh_token if existing_account else ""),
                "expires_at": expires_at,
                "is_connected": True,
                "last_synced_at": timezone.now(),
                "provider_data": {
                    "channel_id": channel_id,
                    "title": title,
                    "description": snippet.get("description", ""),
                    "custom_url": custom_url,
                    "published_at": snippet.get("publishedAt", ""),
                    "thumbnail_url": thumbnail_url,
                    "subscriber_count": subscribers,
                    "video_count": videos,
                    "view_count": views,
                    "uploads_playlist_id": uploads_playlist_id,
                },
            },
        )
        creator.save(update_fields=["updated_at"])

        if registration_return:
            return redirect(build_client_redirect("creator-register", {"social_step": 1, "youtube": "connected", "account": account.account_id}, redirect_client))
        return redirect(build_client_redirect("creator/profile", {"youtube": "connected", "account": account.account_id}, redirect_client))

class YouTubeRefreshView(APIView):
    permission_classes = [IsAuthenticated, IsCreator]

    def post(self, request):
        account = CreatorSocialAccount.objects.filter(
            creator=request.user.creator_profile,
            platform=SocialPlatform.YOUTUBE,
            is_connected=True,
        ).order_by("-last_synced_at", "-created_at").first()
        if not account:
            return Response({"error": "No connected YouTube account found."}, status=status.HTTP_404_NOT_FOUND)

        if not sync_youtube_account(account):
            return Response({"error": "Unable to refresh YouTube videos."}, status=status.HTTP_400_BAD_REQUEST)

        creator = request.user.creator_profile
        creator.save(update_fields=["updated_at"])
        serializer = CreatorProfileSerializer(creator, context={"request": request})
        return Response({"creator": serializer.data})

class XConnectView(APIView):
    permission_classes = [IsAuthenticated, IsCreator]

    def get(self, request):
        if not settings.X_CLIENT_ID:
            return Response(
                {"error": "X OAuth is not configured. Set X_CLIENT_ID."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        client = resolve_oauth_client(request)
        code_verifier = secrets.token_urlsafe(64)
        code_challenge = base64.urlsafe_b64encode(
            hashlib.sha256(code_verifier.encode("ascii")).digest()
        ).decode("ascii").rstrip("=")
        state = signing.dumps(
            {
                "user_id": str(request.user.user_id),
                "nonce": secrets.token_urlsafe(16),
                "code_verifier": code_verifier,
                "client": client,
                "return_to": "registration" if request.query_params.get("return_to") == "registration" else "",
            },
            salt="x-oauth",
        )
        params = {
            "response_type": "code",
            "client_id": settings.X_CLIENT_ID,
            "redirect_uri": settings.X_REDIRECT_URI,
            "scope": settings.X_OAUTH_SCOPES,
            "state": state,
            "code_challenge": code_challenge,
            "code_challenge_method": "S256",
        }
        return Response({"auth_url": f"{X_AUTH_URL}?{urlencode(params)}"})

class XCallbackView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        code = request.query_params.get("code")
        state = request.query_params.get("state")

        def x_error(registration=False, client="web"):
            route = "creator-register" if registration else "creator/profile"
            params = {"social_step": 1, "x": "error"} if registration else {"x": "error"}
            return redirect(build_client_redirect(route, params, client))

        if not code or not state:
            return x_error()

        try:
            state_data = signing.loads(state, salt="x-oauth", max_age=600)
            user = User.objects.get(user_id=state_data["user_id"], role=UserRole.CREATOR)
            creator = user.creator_profile
            code_verifier = state_data["code_verifier"]
            redirect_client = state_data.get("client", "web")
            registration_return = state_data.get("return_to") == "registration"
        except (signing.BadSignature, signing.SignatureExpired, User.DoesNotExist, CreatorProfile.DoesNotExist, KeyError):
            return x_error()

        token_data = {
            "code": code,
            "grant_type": "authorization_code",
            "client_id": settings.X_CLIENT_ID,
            "redirect_uri": settings.X_REDIRECT_URI,
            "code_verifier": code_verifier,
        }
        token_kwargs = {"data": token_data, "timeout": 20}
        if settings.X_CLIENT_SECRET:
            token_kwargs["auth"] = (settings.X_CLIENT_ID, settings.X_CLIENT_SECRET)

        token_response = requests.post(X_TOKEN_URL, **token_kwargs)
        if not token_response.ok:
            return x_error(registration_return, redirect_client)

        token_json = token_response.json()
        access_token = token_json.get("access_token", "")
        refresh_token = token_json.get("refresh_token", "")
        expires_at = None
        expires_in = token_json.get("expires_in")
        if expires_in:
            expires_at = timezone.now() + timedelta(seconds=int(expires_in))

        user_response = requests.get(
            X_ME_URL,
            headers={"Authorization": f"Bearer {access_token}"},
            params={"user.fields": "description,location,profile_image_url,public_metrics,verified,url,created_at"},
            timeout=20,
        )
        if not user_response.ok:
            return x_error(registration_return, redirect_client)

        x_user = user_response.json().get("data", {})
        metrics = x_user.get("public_metrics", {})
        followers = int(metrics.get("followers_count") or 0)
        following = int(metrics.get("following_count") or 0)
        tweet_count = int(metrics.get("tweet_count") or 0)
        listed_count = int(metrics.get("listed_count") or 0)
        username = x_user.get("username", "")
        existing_account = CreatorSocialAccount.objects.filter(
            creator=creator,
            platform=SocialPlatform.X,
        ).first()

        account, _ = CreatorSocialAccount.objects.update_or_create(
            creator=creator,
            platform=SocialPlatform.X,
            defaults={
                "social_id": x_user.get("id", ""),
                "username": username,
                "handle": f"@{username}" if username else x_user.get("name", ""),
                "url": f"https://x.com/{username}" if username else x_user.get("url", ""),
                "followers": followers,
                "media_count": tweet_count,
                "view_count": 0,
                "access_token": access_token,
                "refresh_token": refresh_token or (existing_account.refresh_token if existing_account else ""),
                "expires_at": expires_at,
                "is_connected": True,
                "last_synced_at": timezone.now(),
                "provider_data": {
                    "id": x_user.get("id", ""),
                    "name": x_user.get("name", ""),
                    "username": username,
                    "description": x_user.get("description", ""),
                    "location": x_user.get("location", ""),
                    "profile_image_url": x_user.get("profile_image_url", ""),
                    "verified": x_user.get("verified", False),
                    "followers_count": followers,
                    "following_count": following,
                    "tweet_count": tweet_count,
                    "listed_count": listed_count,
                    "created_at": x_user.get("created_at", ""),
                    "url": x_user.get("url", ""),
                },
            },
        )
        creator.save(update_fields=["updated_at"])

        if registration_return:
            return redirect(build_client_redirect("creator-register", {"social_step": 1, "x": "connected", "account": account.account_id}, redirect_client))
        return redirect(build_client_redirect("creator/profile", {"x": "connected", "account": account.account_id}, redirect_client))
