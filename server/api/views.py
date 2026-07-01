import json
import os
import base64
import hashlib
import secrets
import string
from urllib.parse import urlencode

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.core import signing
from django.db import transaction
from django.db.models import Count, Q
from django.shortcuts import redirect
from django.utils import timezone
from django.utils.crypto import get_random_string
from datetime import timedelta
import requests
from rest_framework import status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.mail import send_mail

from .models import (
    ApplicationStatus,
    BrandProfile,
    BrandShortlist,
    Campaign,
    CampaignApplication,
    CampaignProgress,
    CampaignStatus,
    CreatorProfile,
    CreatorSocialAccount,
    OtpChannel,
    OtpVerification,
    SocialPlatform,
    UserRole,
    VerificationStatus,
)
from .permissions import IsAdminUserRole, IsBrand, IsCreator, IsVerifiedColluneMember
from .serializers import (
    AuthUserSerializer,
    BrandProfileSerializer,
    BrandRegisterSerializer,
    BrandShortlistSerializer,
    CampaignApplicationSerializer,
    CampaignProgressSerializer,
    CampaignSerializer,
    CampaignStatusSummarySerializer,
    CreatorsProfileListSerializer,
    CreatorProfileSerializer,
    CreatorRegisterSerializer,
    CreatorSocialAccountSerializer,
    EmailAvailabilitySerializer,
    LoginSerializer,
    OtpSendSerializer,
    OtpVerifySerializer,
)

User = get_user_model()
BREVO_API_BASE = "https://api.brevo.com/v3"
OTP_EXPIRY_MINUTES = 10
OTP_MAX_ATTEMPTS = 5
INSTAGRAM_AUTH_URL = "https://www.instagram.com/oauth/authorize"
INSTAGRAM_TOKEN_URL = "https://api.instagram.com/oauth/access_token"
INSTAGRAM_LONG_LIVED_TOKEN_URL = "https://graph.instagram.com/access_token"
INSTAGRAM_ME_URL = "https://graph.instagram.com/me"
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
YOUTUBE_CHANNELS_URL = "https://www.googleapis.com/youtube/v3/channels"
YOUTUBE_PLAYLIST_ITEMS_URL = "https://www.googleapis.com/youtube/v3/playlistItems"
YOUTUBE_VIDEOS_URL = "https://www.googleapis.com/youtube/v3/videos"
YOUTUBE_ANALYTICS_REPORTS_URL = "https://youtubeanalytics.googleapis.com/v2/reports"
X_AUTH_URL = "https://twitter.com/i/oauth2/authorize"
X_TOKEN_URL = "https://api.twitter.com/2/oauth2/token"
X_ME_URL = "https://api.twitter.com/2/users/me"


def generate_username(email):
    base = email.split("@", 1)[0].replace(".", "").replace("_", "")[:20] or "collune"
    candidate = base
    counter = 1
    while User.objects.filter(username=candidate).exists():
        counter += 1
        candidate = f"{base}{counter}"
    return candidate



def parse_payload(request):
    if "payload" not in request.data:
        return request.data.copy()
    try:
        payload = json.loads(request.data["payload"])
    except (TypeError, json.JSONDecodeError):
        payload = {}
    data = payload.copy()
    for key, value in request.FILES.items():
        data[key] = value
    return data


def auth_user_payload(user):
    role_map = {
        UserRole.ADMIN: "Admin",
        UserRole.BRAND: "Brand",
        UserRole.CREATOR: "Creator",
    }
    return {
        "name": user.name,
        "email": user.email,
        "role": role_map.get(user.role, "Admin"),
    }


def auth_response(user, message="Login successful."):
    token, _ = Token.objects.get_or_create(user=user)
    refresh = RefreshToken.for_user(user)
    return {
        "message": message,
        "token": token.key,
        "refresh": str(refresh),
        "access": str(refresh.access_token),
        "user": auth_user_payload(user),
    }


def parse_youtube_duration_seconds(duration):
    if not duration or not duration.startswith("PT"):
        return 0
    number = ""
    seconds = 0
    for char in duration[2:]:
        if char.isdigit():
            number += char
            continue
        value = int(number or 0)
        number = ""
        if char == "H":
            seconds += value * 3600
        if char == "M":
            seconds += value * 60
        if char == "S":
            seconds += value
    return seconds


def youtube_report(access_token, params):
    response = requests.get(
        YOUTUBE_ANALYTICS_REPORTS_URL,
        headers={"Authorization": f"Bearer {access_token}"},
        params=params,
        timeout=20,
    )
    if not response.ok:
        return {"error": response.text[:500], "status_code": response.status_code}
    data = response.json()
    headers = [item.get("name") for item in data.get("columnHeaders", [])]
    rows = data.get("rows", [])
    return {"headers": headers, "rows": [dict(zip(headers, row)) for row in rows]}


def fetch_youtube_videos(access_token, uploads_playlist_id):
    if not uploads_playlist_id:
        return []

    playlist_response = requests.get(
        YOUTUBE_PLAYLIST_ITEMS_URL,
        headers={"Authorization": f"Bearer {access_token}"},
        params={
            "part": "snippet,contentDetails",
            "playlistId": uploads_playlist_id,
            "maxResults": 50,
        },
        timeout=20,
    )
    if not playlist_response.ok:
        return []

    video_ids = [
        item.get("contentDetails", {}).get("videoId")
        for item in playlist_response.json().get("items", [])
        if item.get("contentDetails", {}).get("videoId")
    ]
    if not video_ids:
        return []

    videos_response = requests.get(
        YOUTUBE_VIDEOS_URL,
        headers={"Authorization": f"Bearer {access_token}"},
        params={
            "part": "snippet,contentDetails,statistics",
            "id": ",".join(video_ids),
            "maxResults": 50,
        },
        timeout=20,
    )
    if not videos_response.ok:
        return []

    videos = []
    for item in videos_response.json().get("items", []):
        snippet = item.get("snippet", {})
        content_details = item.get("contentDetails", {})
        statistics = item.get("statistics", {})
        duration_seconds = parse_youtube_duration_seconds(content_details.get("duration", ""))
        thumbnails = snippet.get("thumbnails", {})
        thumbnail_url = (
            thumbnails.get("high", {}).get("url")
            or thumbnails.get("medium", {}).get("url")
            or thumbnails.get("default", {}).get("url")
            or ""
        )
        videos.append(
            {
                "video_id": item.get("id", ""),
                "title": snippet.get("title", ""),
                "published_at": snippet.get("publishedAt", ""),
                "thumbnail_url": thumbnail_url,
                "duration": content_details.get("duration", ""),
                "duration_seconds": duration_seconds,
                "content_type": "SHORT" if duration_seconds <= 60 else "LONG",
                "view_count": int(statistics.get("viewCount") or 0),
                "like_count": int(statistics.get("likeCount") or 0),
                "comment_count": int(statistics.get("commentCount") or 0),
            }
        )
    return videos


def fetch_youtube_analytics(access_token):
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=90)
    base_params = {
        "ids": "channel==MINE",
        "startDate": start_date.isoformat(),
        "endDate": end_date.isoformat(),
    }

    return {
        "date_range": {"start_date": start_date.isoformat(), "end_date": end_date.isoformat()},
        "summary": youtube_report(
            access_token,
            {
                **base_params,
                "metrics": "views,comments,shares,likes,estimatedMinutesWatched,averageViewDuration",
            },
        ),
        "top_videos": youtube_report(
            access_token,
            {
                **base_params,
                "dimensions": "video",
                "metrics": "views,comments,shares,likes,estimatedMinutesWatched,averageViewDuration",
                "sort": "-views",
                "maxResults": 200,
            },
        ),
        "content_type": youtube_report(
            access_token,
            {
                **base_params,
                "dimensions": "creatorContentType",
                "metrics": "views,comments,shares,likes,estimatedMinutesWatched",
            },
        ),
        "age_gender": youtube_report(
            access_token,
            {
                **base_params,
                "dimensions": "ageGroup,gender",
                "metrics": "viewerPercentage",
            },
        ),
        "location": youtube_report(
            access_token,
            {
                **base_params,
                "dimensions": "country",
                "metrics": "views,estimatedMinutesWatched,averageViewDuration",
                "sort": "-views",
                "maxResults": 25,
            },
        ),
    }


def refresh_youtube_access_token(account):
    if account.access_token and account.expires_at and account.expires_at > timezone.now() + timedelta(minutes=5):
        return account.access_token
    if not account.refresh_token:
        return account.access_token

    token_response = requests.post(
        GOOGLE_TOKEN_URL,
        data={
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "refresh_token": account.refresh_token,
            "grant_type": "refresh_token",
        },
        timeout=20,
    )
    if not token_response.ok:
        return account.access_token

    token_data = token_response.json()
    access_token = token_data.get("access_token", account.access_token)
    expires_in = token_data.get("expires_in")
    account.access_token = access_token
    if expires_in:
        account.expires_at = timezone.now() + timedelta(seconds=int(expires_in))
    account.save(update_fields=["access_token", "expires_at"])
    return access_token


def sync_youtube_account(account):
    access_token = refresh_youtube_access_token(account)
    channel_response = requests.get(
        YOUTUBE_CHANNELS_URL,
        headers={"Authorization": f"Bearer {access_token}"},
        params={"part": "snippet,statistics,contentDetails", "mine": "true"},
        timeout=20,
    )
    if not channel_response.ok:
        return False

    items = channel_response.json().get("items", [])
    if not items:
        return False

    channel = items[0]
    snippet = channel.get("snippet", {})
    statistics = channel.get("statistics", {})
    content_details = channel.get("contentDetails", {})
    uploads_playlist_id = content_details.get("relatedPlaylists", {}).get("uploads", "")
    youtube_videos = fetch_youtube_videos(access_token, uploads_playlist_id)
    youtube_short_video_count = sum(1 for video in youtube_videos if video.get("content_type") == "SHORT")
    youtube_long_video_count = sum(1 for video in youtube_videos if video.get("content_type") == "LONG")
    youtube_analytics = fetch_youtube_analytics(access_token)
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

    account.social_id = channel.get("id", account.social_id)
    account.username = snippet.get("customUrl", "") or snippet.get("title", account.username)
    account.handle = snippet.get("title", account.handle)
    account.url = f"https://www.youtube.com/channel/{account.social_id}" if account.social_id else account.url
    account.followers = subscribers
    account.media_count = videos
    account.view_count = views
    account.youtube_short_video_count = youtube_short_video_count
    account.youtube_long_video_count = youtube_long_video_count
    account.youtube_videos = youtube_videos
    account.youtube_analytics = youtube_analytics
    account.last_synced_at = timezone.now()
    account.provider_data = {
        **(account.provider_data or {}),
        "channel_id": account.social_id,
        "title": snippet.get("title", ""),
        "description": snippet.get("description", ""),
        "custom_url": snippet.get("customUrl", ""),
        "published_at": snippet.get("publishedAt", ""),
        "thumbnail_url": thumbnail_url,
        "subscriber_count": subscribers,
        "video_count": videos,
        "view_count": views,
        "uploads_playlist_id": uploads_playlist_id,
    }
    account.save()
    return True


def create_user(user_data, role):
    email = user_data["email"].lower()
    user = User.objects.create_user(
        username=generate_username(email),
        email=email,
        password=user_data["password"],
        name=user_data["name"],
        phone_no=user_data.get("phone_no") or None,
        role=role,
    )
    return user


def normalize_otp_target(channel, target):
    value = target.strip()
    if channel == OtpChannel.EMAIL:
        return value.lower()
    return value.replace(" ", "")


def create_otp(channel, target):
    normalized_target = normalize_otp_target(channel, target)
    code = get_random_string(6, allowed_chars=string.digits)
    OtpVerification.objects.filter(
        channel=channel,
        target=normalized_target,
        purpose="creator_registration",
        is_verified=False,
    ).delete()
    return OtpVerification.objects.create(
        channel=channel,
        target=normalized_target,
        code=code,
        purpose="creator_registration",
        expires_at=timezone.now() + timedelta(minutes=OTP_EXPIRY_MINUTES),
    )


def brevo_headers():
    api_key = os.getenv("BREVO_API_KEY") or os.getenv("BREVO_APIKEY")
    if not api_key:
        raise RuntimeError("BREVO_API_KEY is not configured.")
    return {
        "accept": "application/json",
        "api-key": api_key,
        "content-type": "application/json",
    }


def send_brevo_email_otp(target, code):

    sender_email = os.getenv("DEFAULT_FROM_EMAIL")
    if not sender_email:
        raise RuntimeError("DEFAULT_FROM_EMAIL is not configured.")
    try:
        send_mail(
                    subject="Your Collune verification code",
                    message=f"Your Collune verification code is {code}. This code expires in {OTP_EXPIRY_MINUTES} minutes.",
                    from_email=sender_email,
                    recipient_list=[target],
                    fail_silently=False,
                )
    except RuntimeError as error:
        print("sending error",error)

    


def send_brevo_sms_otp(target, code):
    sender = os.getenv("BREVO_SMS_SENDER", "Collune")[:11]
    payload = {
        "sender": sender,
        "recipient": target,
        "content": f"Your Collune verification code is {code}. It expires in {OTP_EXPIRY_MINUTES} minutes.",
        "type": "transactional",
        "tag": "creator_registration",
    }
    response = requests.post(f"{BREVO_API_BASE}/transactionalSMS/sms", json=payload, headers=brevo_headers(), timeout=15)
    response.raise_for_status()


def send_otp_message(otp):
    if otp.channel == OtpChannel.EMAIL:

        send_brevo_email_otp(otp.target, otp.code)
        return
    send_brevo_sms_otp(otp.target, otp.code)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data.get("user")
        user.last_login_at = timezone.now()
        user.save(update_fields=["last_login_at"])
        return Response(auth_response(user))


class EmailAvailabilityView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        serializer = EmailAvailabilitySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        return Response({
            "email": email,
            "available": not User.objects.filter(email__iexact=email).exists(),
        })


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"user": AuthUserSerializer(request.user).data})


class SignoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response({"message": "Signed out."})


class OtpSendView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OtpSendSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        channel = serializer.validated_data["channel"]
        target = normalize_otp_target(channel, serializer.validated_data["target"])
        otp = create_otp(channel, target)
        try:
            send_otp_message(otp)
        except requests.RequestException as exc:
            otp.delete()
            return Response(
                {"error": "Could not send OTP through Brevo.", "detail": str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        except RuntimeError as exc:
            otp.delete()
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(
            {
                "message": "OTP sent.",
                "channel": channel,
                "target": target,
                "expires_in": OTP_EXPIRY_MINUTES * 60,
            },
            status=status.HTTP_200_OK,
        )


class OtpVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OtpVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        channel = serializer.validated_data["channel"]
        target = normalize_otp_target(channel, serializer.validated_data["target"])
        otp = OtpVerification.objects.filter(
            channel=channel,
            target=target,
            purpose="creator_registration",
            is_verified=False,
        ).first()
        if not otp:
            return Response({"error": "No active OTP found."}, status=status.HTTP_400_BAD_REQUEST)
        if otp.expires_at <= timezone.now():
            return Response({"error": "OTP has expired."}, status=status.HTTP_400_BAD_REQUEST)
        if otp.attempts >= OTP_MAX_ATTEMPTS:
            return Response({"error": "Too many OTP attempts."}, status=status.HTTP_400_BAD_REQUEST)

        otp.attempts += 1
        if otp.code != serializer.validated_data["code"]:
            otp.save(update_fields=["attempts"])
            return Response({"error": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)

        otp.is_verified = True
        otp.verified_at = timezone.now()
        otp.save(update_fields=["attempts", "is_verified", "verified_at"])
        return Response({"message": "OTP verified.", "channel": channel, "target": target})


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

class CreatorsListView(APIView):
    permission_classes = [IsAuthenticated, IsVerifiedColluneMember]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        return CreatorProfile.objects.select_related("user").prefetch_related("social_accounts").filter(
            verification_status=VerificationStatus.VERIFIED,
            is_profile_visible=True,
        )

    def get(self, request, creator_id=None):
        if creator_id:
            try:
                creator = self.get_queryset().get(creator_id=creator_id)
            except CreatorProfile.DoesNotExist:
                return Response({"error": "Creator profile not found."}, status=status.HTTP_404_NOT_FOUND)
            serializer = CreatorsProfileListSerializer(creator, context={"request": request})
            return Response({"creator": serializer.data})

        creators = (
            self.get_queryset().order_by("-created_at")
        )
        serializer = CreatorsProfileListSerializer(creators, many=True, context={"request": request})
        return Response({"creators": serializer.data})


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


class BrandShortlistViewSet(viewsets.ModelViewSet):
    serializer_class = BrandShortlistSerializer
    permission_classes = [IsAuthenticated, IsBrand]

    def get_queryset(self):
        return BrandShortlist.objects.select_related("brand").prefetch_related("creators", "creators__user").filter(
            brand__user=self.request.user
        )

    def perform_create(self, serializer):
        serializer.save(brand=self.request.user.brand_profile)


class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role == UserRole.BRAND and hasattr(request.user, "brand_profile"):
            brand = request.user.brand_profile
            return Response(
                {
                    "mode": "brand",
                    "verification_status": brand.verification_status,
                    "profile_completion": brand.profile_completion,
                    "metrics": {
                        "active_campaigns": Campaign.objects.filter(brand=brand, status=CampaignStatus.ACTIVE).count(),
                        "creator_applications": CampaignApplication.objects.filter(campaign__brand=brand).count(),
                        "shortlisted_creators": CreatorProfile.objects.filter(shortlisted_by__brand=brand).distinct().count(),
                    },
                }
            )
        if request.user.role == UserRole.CREATOR and hasattr(request.user, "creator_profile"):
            creator = request.user.creator_profile
            return Response(
                {
                    "mode": "creator",
                    "verification_status": creator.verification_status,
                    "profile_completion": creator.profile_completion,
                    "metrics": {
                        "campaign_applications": CampaignApplication.objects.filter(creator=creator).count(),
                        "brand_shortlists": BrandShortlist.objects.filter(creators=creator).count(),
                        "connected_accounts": CreatorSocialAccount.objects.filter(creator=creator, is_connected=True).count(),
                    },
                }
            )
        return Response({"mode": "admin", "metrics": {"brands": BrandProfile.objects.count(), "creators": CreatorProfile.objects.count()}})


class VerificationView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def patch(self, request, profile_type, profile_id):
        status_value = request.data.get("verification_status")
        if status_value not in VerificationStatus.values:
            return Response({"verification_status": ["Invalid verification status."]}, status=status.HTTP_400_BAD_REQUEST)
        model = BrandProfile if profile_type == "brands" else CreatorProfile if profile_type == "creators" else None
        if not model:
            return Response({"error": "Invalid profile type."}, status=status.HTTP_400_BAD_REQUEST)
        profile = model.objects.filter(pk=profile_id).first()
        if not profile:
            return Response({"error": "Profile not found."}, status=status.HTTP_404_NOT_FOUND)
        profile.verification_status = status_value
        profile.save(update_fields=["verification_status", "updated_at"])
        serializer_class = BrandProfileSerializer if profile_type == "brands" else CreatorProfileSerializer
        return Response({"profile": serializer_class(profile, context={"request": request}).data})
