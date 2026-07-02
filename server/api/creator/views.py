import base64
import hashlib
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
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import (
    ApplicationStatus, Campaign, CampaignApplication, CampaignStatus, CreatorProfile, CreatorSocialAccount, SocialPlatform, UserRole, VerificationStatus,
)
from ..permissions import IsCreator, IsVerifiedColluneMember
from ..brand.serializers import CampaignApplicationSerializer
from ..common.services import auth_response, create_user, parse_payload
from .serializers import CreatorsProfileListSerializer, CreatorProfileSerializer, CreatorRegisterSerializer, CreatorSocialAccountSerializer
from .services import fetch_youtube_analytics, fetch_youtube_videos, sync_youtube_account

User = get_user_model()
INSTAGRAM_AUTH_URL = "https://www.instagram.com/oauth/authorize"
INSTAGRAM_TOKEN_URL = "https://api.instagram.com/oauth/access_token"
INSTAGRAM_LONG_LIVED_TOKEN_URL = "https://graph.instagram.com/access_token"
INSTAGRAM_ME_URL = "https://graph.instagram.com/me"
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
YOUTUBE_CHANNELS_URL = "https://www.googleapis.com/youtube/v3/channels"
X_AUTH_URL = "https://twitter.com/i/oauth2/authorize"
X_TOKEN_URL = "https://api.twitter.com/2/oauth2/token"
X_ME_URL = "https://api.twitter.com/2/users/me"


class CreatorRegisterView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    @transaction.atomic
    def post(self, request):
        serializer = CreatorRegisterSerializer(data=parse_payload(request))
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        user = create_user(data["user"], UserRole.CREATOR)
        creator = CreatorProfile.objects.create(
            user=user,
            display_name=data.get("display_name") or user.profile_name,
            category=data.get("category", ""),
            location=data.get("location", ""),
            languages=data.get("languages", []),
            collaboration_preferences=data.get("collaboration_preferences", []),
            preferred_response_time=data.get("preferred_response_time", ""),
            open_to_travel=data.get("open_to_travel", False),
            bio=data.get("bio", ""),
            portfolio_url=data.get("portfolio_url", ""),
            profile_image=data.get("profile_image"),
            audience_size=data.get("audience_size", 0),
            rate_min=data.get("rate_min", 0),
            rate_max=data.get("rate_max", 0),
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
        return Response(
            {
                **auth_response(user, "Creator account created."),
                "creator": CreatorProfileSerializer(creator, context={"request": request}).data,
            },
            status=status.HTTP_201_CREATED,
        )
    
class CreatorDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsCreator]

    def get_profile_completion(self, creator):
        checks = [
            bool(creator.display_name.strip()),
            bool(creator.category.strip()),
            bool(creator.location.strip()),
            bool(creator.languages),
            bool(creator.collaboration_preferences),
            bool(creator.preferred_response_time.strip()),
            bool(creator.bio.strip()),
            bool(getattr(creator, "about", "").strip()),
            bool(creator.portfolio_url.strip()),
            bool(creator.profile_image),
            creator.audience_size > 0,
            creator.rate_min > 0,
            creator.rate_max > 0 and creator.rate_max >= creator.rate_min,
            creator.social_accounts.filter(is_connected=True).exists(),
        ]
        completion = round((sum(checks) / len(checks)) * 100)

        if creator.profile_completion != completion:
            creator.profile_completion = completion
            creator.save(update_fields=["profile_completion"])

        return completion

    def get_matching_campaigns(self, creator):
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

        campaigns = Campaign.objects.filter(status=CampaignStatus.ACTIVE).order_by("-created_at")

        def campaign_score(campaign):
            requirement_text = (campaign.brand_requirements or "").lower()
            score = sum(1 for term in normalized_terms if term in requirement_text)
            if creator.audience_size >= campaign.minimum_followers:
                score += 1
            if campaign.category and campaign.category.strip().lower() == creator.category.strip().lower():
                score += 3
            if campaign.location and campaign.location.strip().lower() == creator.location.strip().lower():
                score += 2
            return score

        ranked_campaigns = sorted(campaigns, key=campaign_score, reverse=True)[:3]

        return [
            {
                "id": str(campaign.campaign_id),
                "title": campaign.title,
                "objective": campaign.objective,
                "cover_image": campaign.cover_image,
                "deadline": campaign.deadline.isoformat() if campaign.deadline else None,
                "looking_for": campaign.category or campaign.brand_requirements,
            }
            for campaign in ranked_campaigns
        ]

    def get(self, request, profile_verified=False):
        creator = getattr(request.user, "creator_profile", None)
        if not creator:
            return Response({"error": "No creator profile found."}, status=status.HTTP_404_NOT_FOUND)

        profile_completion = self.get_profile_completion(creator)
        social_media_connected = creator.social_accounts.filter(is_connected=True).exists()
        profile_verified = profile_verified or creator.verification_status == VerificationStatus.VERIFIED

        if profile_verified:
            data = {
                "profile_view": getattr(creator, "profile_view_count", 0),
                "brand_requests": getattr(creator, "brand_request_count", 0),
                "campaign_applications": creator.applications.count(),
                "profile_completion": profile_completion,
                "campaigns": self.get_matching_campaigns(creator),

            }
            return Response({"creator": data})
        
        data = {
            "account_id": str(creator.creator_id),
            "account_created": bool(creator.created_at),
            "social_media_connected": social_media_connected,
            "verification_status": creator.verification_status,
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

        campaigns = Campaign.objects.select_related("brand").filter(status=CampaignStatus.ACTIVE)

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
                "title": campaign.title,
                "objective": campaign.objective,
                "deadline": campaign.deadline.isoformat() if campaign.deadline else None,
                "posted_at": campaign.created_at.isoformat(),
                "brand_name": campaign.brand.company_name,
                "brand_logo": request.build_absolute_uri(campaign.brand.logo.url) if campaign.brand.logo else None,
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
            status=CampaignStatus.ACTIVE,
        ).first()
        if not campaign:
            return Response({"error": "Campaign not found."}, status=status.HTTP_404_NOT_FOUND)
        data = {
            "id": str(campaign.campaign_id),
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
            "cover_image": campaign.cover_image,
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
            }
        }
        return Response({"campaign": data})

class CreatorProfileViewSet(viewsets.ModelViewSet):
    serializer_class = CreatorProfileSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        queryset = CreatorProfile.objects.select_related("user").prefetch_related("social_accounts")
        if self.request.user.role == UserRole.CREATOR:
            return queryset.filter(user=self.request.user)
        if self.request.user.role == UserRole.BRAND:
            return queryset.filter(verification_status=VerificationStatus.VERIFIED, is_profile_visible=True)
        return queryset.all()

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [IsAuthenticated(), IsVerifiedColluneMember()]
        return super().get_permissions()

    @action(detail=False, methods=["get", "patch"], url_path="me")
    def me(self, request):
        creator = getattr(request.user, "creator_profile", None)
        if not creator:
            return Response({"error": "No creator profile found."}, status=status.HTTP_404_NOT_FOUND)
        if request.method == "PATCH":
            serializer = self.get_serializer(creator, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response({"creator": serializer.data})
        return Response({"creator": self.get_serializer(creator).data})

class CreatorSocialAccountViewSet(viewsets.ModelViewSet):
    serializer_class = CreatorSocialAccountSerializer
    permission_classes = [IsAuthenticated, IsCreator]

    def get_queryset(self):
        return CreatorSocialAccount.objects.filter(creator__user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user.creator_profile)

class CampaignApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = CampaignApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = CampaignApplication.objects.select_related("campaign", "campaign__brand", "creator", "creator__user")
        if self.request.user.role == UserRole.BRAND:
            return queryset.filter(campaign__brand__user=self.request.user)
        if self.request.user.role == UserRole.CREATOR:
            return queryset.filter(creator__user=self.request.user)
        return queryset.all()

    def create(self, request, *args, **kwargs):
        if request.user.role != UserRole.CREATOR:
            raise PermissionDenied("Only creators can apply to campaigns.")

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        campaign = serializer.validated_data["campaign"]
        application, _ = CampaignApplication.objects.update_or_create(
            campaign=campaign,
            creator=request.user.creator_profile,
            defaults={
                "pitch": serializer.validated_data.get("pitch", ""),
                "quoted_rate": serializer.validated_data.get("quoted_rate") or 0,
                "status": ApplicationStatus.APPLIED,
            },
        )
        response_serializer = self.get_serializer(application)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    def perform_update(self, serializer):
        serializer.save()

    def perform_destroy(self, instance):
        instance.delete()

class CreatorProfileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_object(self, request):
        return getattr(request.user, "creator_profile", None)

    def get(self, request):
        creator = self.get_object(request)
        if not creator:
            return Response({"error": "No creator profile found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = CreatorProfileSerializer(creator, context={"request": request})
        return Response({"creator": serializer.data})

    def patch(self, request):
        creator = self.get_object(request)
        if not creator:
            return Response({"error": "No creator profile found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = CreatorProfileSerializer(
            creator,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"creator": serializer.data})


class CreatorListViewSet(APIView):
    permission_classes = [AllowAny]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request, creator_id=None):
        if creator_id:
            try:
                creator = CreatorProfile.objects.select_related("user").get(
                    creator_id=creator_id,
                    verification_status=VerificationStatus.VERIFIED.value,
                    is_profile_visible=True,
                )
            except CreatorProfile.DoesNotExist:
                return Response({"error": "Creator profile not found."}, status=status.HTTP_404_NOT_FOUND)

            data = {
                "id": str(creator.creator_id),
                "creator_id": str(creator.creator_id),
                "display_name": creator.display_name,
                "category": creator.category,
                "verified": creator.verification_status == VerificationStatus.VERIFIED.value,
                "username": creator.user.username,
                "profile_image": request.build_absolute_uri(creator.profile_image.url) if creator.profile_image else None,
                "updated_at": creator.updated_at,
                "languages": creator.languages,
                "location": creator.location,
                "bio": creator.bio,
                "total_flowers": creator.audience_size,
                "about": creator.about,
            }
            return Response({"creator": data})
        creators = CreatorProfile.objects.select_related("user").filter(
            verification_status=VerificationStatus.VERIFIED.value,
            is_profile_visible=True,
        ).order_by("-created_at")

        data = [
            {
                "id": str(creator.creator_id),
                "creator_id": str(creator.creator_id),
                "display_name": creator.display_name,
                "category": creator.category,
                "verified": creator.verification_status == VerificationStatus.VERIFIED.value,
                "username": creator.user.username,
                "profile_image": request.build_absolute_uri(creator.profile_image.url) if creator.profile_image else None,
            }
            for creator in creators
        ]
        return Response({"creators": data})

class InstagramConnectView(APIView):
    permission_classes = [IsAuthenticated, IsCreator]

    def get(self, request):
        if not settings.INSTAGRAM_CLIENT_ID or not settings.INSTAGRAM_CLIENT_SECRET:
            return Response(
                {"error": "Instagram OAuth is not configured. Set INSTAGRAM_CLIENT_ID and INSTAGRAM_CLIENT_SECRET."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        state = signing.dumps(
            {
                "user_id": str(request.user.user_id),
                "nonce": secrets.token_urlsafe(16),
            },
            salt="instagram-oauth",
        )
        try:

            params = {
            "client_id": settings.INSTAGRAM_CLIENT_ID,
            "redirect_uri": settings.INSTAGRAM_REDIRECT_URI,
            "scope": settings.INSTAGRAM_OAUTH_SCOPES,
            "response_type": "code",
            }
            return Response({"auth_url": f"{INSTAGRAM_AUTH_URL}?{urlencode(params)}"})
        except :
            return Response("reeor")

class InstagramCallbackView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        code = request.query_params.get("code")
        state = request.query_params.get("state")
        frontend_url = settings.FRONTEND_URL.rstrip("/")

        if not code or not state:
            return redirect(f"{frontend_url}/creator/profile?instagram=error")

        try:
            state_data = signing.loads(state, salt="instagram-oauth", max_age=600)
            user = User.objects.get(user_id=state_data["user_id"], role=UserRole.CREATOR)
            creator = user.creator_profile
        except (signing.BadSignature, signing.SignatureExpired, User.DoesNotExist, CreatorProfile.DoesNotExist, KeyError):
            return redirect(f"{frontend_url}/creator/profile?instagram=error")

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
            return redirect(f"{frontend_url}/creator/profile?instagram=error")

        token_data = token_response.json()
        access_token = token_data.get("access_token", "")
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
            return redirect(f"{frontend_url}/creator/profile?instagram=error")

        profile_data = profile_response.json()
        social_id = str(profile_data.get("user_id") or profile_data.get("id") or instagram_user_id)
        username = profile_data.get("username", "")
        followers = int(profile_data.get("followers_count") or 0)
        media_count = int(profile_data.get("media_count") or 0)

        account, _ = CreatorSocialAccount.objects.update_or_create(
            creator=creator,
            platform=SocialPlatform.INSTAGRAM,
            social_id=social_id,
            defaults={
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
        creator.audience_size = max(creator.audience_size, followers)
        creator.save(update_fields=["audience_size", "updated_at"])

        return redirect(f"{frontend_url}/creator/profile?instagram=connected&account={account.account_id}")

class YouTubeConnectView(APIView):
    permission_classes = [IsAuthenticated, IsCreator]

    def get(self, request):
        if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
            return Response(
                {"error": "YouTube OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        state = signing.dumps(
            {
                "user_id": str(request.user.user_id),
                "nonce": secrets.token_urlsafe(16),
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
        frontend_url = settings.FRONTEND_URL.rstrip("/")

        if not code or not state:
            return redirect(f"{frontend_url}/creator/profile?youtube=error")

        try:
            state_data = signing.loads(state, salt="youtube-oauth", max_age=600)
            user = User.objects.get(user_id=state_data["user_id"], role=UserRole.CREATOR)
            creator = user.creator_profile
        except (signing.BadSignature, signing.SignatureExpired, User.DoesNotExist, CreatorProfile.DoesNotExist, KeyError):
            return redirect(f"{frontend_url}/creator/profile?youtube=error")

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
            return redirect(f"{frontend_url}/creator/profile?youtube=error")

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
            return redirect(f"{frontend_url}/creator/profile?youtube=error")

        channel_data = channel_response.json()
        items = channel_data.get("items", [])
        if not items:
            return redirect(f"{frontend_url}/creator/profile?youtube=no_channel")

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
        youtube_short_video_count = sum(1 for video in youtube_videos if video.get("content_type") == "SHORT")
        youtube_long_video_count = sum(1 for video in youtube_videos if video.get("content_type") == "LONG")
        youtube_analytics = fetch_youtube_analytics(access_token)
        existing_account = CreatorSocialAccount.objects.filter(
            creator=creator,
            platform=SocialPlatform.YOUTUBE,
            social_id=channel_id,
        ).first()

        account, _ = CreatorSocialAccount.objects.update_or_create(
            creator=creator,
            platform=SocialPlatform.YOUTUBE,
            social_id=channel_id,
            defaults={
                "username": custom_url or title,
                "handle": title,
                "url": f"https://www.youtube.com/channel/{channel_id}" if channel_id else "",
                "followers": subscribers,
                "media_count": videos,
                "view_count": views,
                "youtube_short_video_count": youtube_short_video_count,
                "youtube_long_video_count": youtube_long_video_count,
                "youtube_videos": youtube_videos,
                "youtube_analytics": youtube_analytics,
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
        creator.audience_size = max(creator.audience_size, subscribers)
        creator.save(update_fields=["audience_size", "updated_at"])

        return redirect(f"{frontend_url}/creator/profile?youtube=connected&account={account.account_id}")

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
        creator.audience_size = max(creator.audience_size, account.followers)
        creator.save(update_fields=["audience_size", "updated_at"])
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

        code_verifier = secrets.token_urlsafe(64)
        code_challenge = base64.urlsafe_b64encode(
            hashlib.sha256(code_verifier.encode("ascii")).digest()
        ).decode("ascii").rstrip("=")
        state = signing.dumps(
            {
                "user_id": str(request.user.user_id),
                "nonce": secrets.token_urlsafe(16),
                "code_verifier": code_verifier,
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
        frontend_url = settings.FRONTEND_URL.rstrip("/")

        if not code or not state:
            return redirect(f"{frontend_url}/creator/profile?x=error")

        try:
            state_data = signing.loads(state, salt="x-oauth", max_age=600)
            user = User.objects.get(user_id=state_data["user_id"], role=UserRole.CREATOR)
            creator = user.creator_profile
            code_verifier = state_data["code_verifier"]
        except (signing.BadSignature, signing.SignatureExpired, User.DoesNotExist, CreatorProfile.DoesNotExist, KeyError):
            return redirect(f"{frontend_url}/creator/profile?x=error")

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
            return redirect(f"{frontend_url}/creator/profile?x=error")

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
            return redirect(f"{frontend_url}/creator/profile?x=error")

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
            social_id=x_user.get("id", ""),
        ).first()

        account, _ = CreatorSocialAccount.objects.update_or_create(
            creator=creator,
            platform=SocialPlatform.X,
            social_id=x_user.get("id", ""),
            defaults={
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
        creator.audience_size = max(creator.audience_size, followers)
        creator.save(update_fields=["audience_size", "updated_at"])

        return redirect(f"{frontend_url}/creator/profile?x=connected&account={account.account_id}")
