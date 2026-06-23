import json
import os
import secrets
import string
from urllib.parse import urlencode

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.core import signing
from django.db import transaction
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
    CampaignStatusSummary,
    CampaignStatus,
    CreatorProfile,
    CreatorSocialAccount,
    OtpChannel,
    OtpVerification,
    SocialPlatform,
    UserRole,
    VerificationStatus,
)
from .permissions import IsAdminUserRole, IsBrand, IsCreator
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


def auth_response(user, message="Login successful."):
    token, _ = Token.objects.get_or_create(user=user)
    refresh = RefreshToken.for_user(user)
    return {
        "message": message,
        "token": token.key,
        "refresh": str(refresh),
        "access": str(refresh.access_token),
        "user": AuthUserSerializer(user).data,
    }


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
        username = serializer.validated_data["username"]
        password = serializer.validated_data["password"]
        user = authenticate(request, username=username, password=password)
        if not user:
            user_obj = User.objects.filter(email__iexact=username).first()
            if user_obj:
                user = authenticate(request, username=user_obj.username, password=password)
        if not user:
            return Response({"error": "Invalid username or password."}, status=status.HTTP_400_BAD_REQUEST)
        if not user.is_active or not user.status:
            return Response({"error": "This account is inactive."}, status=status.HTTP_403_FORBIDDEN)
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
    permission_classes = [AllowAny]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        return CreatorProfile.objects.select_related("user").prefetch_related("social_accounts")

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
            params={"part": "snippet,statistics", "mine": "true"},
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
                "access_token": access_token,
                "refresh_token": refresh_token,
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
                },
            },
        )
        creator.audience_size = max(creator.audience_size, subscribers)
        creator.save(update_fields=["audience_size", "updated_at"])

        return redirect(f"{frontend_url}/creator/profile?youtube=connected&account={account.account_id}")


class BrandProfileViewSet(viewsets.ModelViewSet):
    serializer_class = BrandProfileSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        if self.request.user.role == UserRole.ADMIN:
            return BrandProfile.objects.select_related("user").all()
        if self.request.user.role == UserRole.BRAND:
            return BrandProfile.objects.select_related("user").filter(user=self.request.user)
        return BrandProfile.objects.select_related("user").filter(verification_status=VerificationStatus.VERIFIED)

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
            return queryset.filter(verification_status=VerificationStatus.VERIFIED)
        return queryset.all()

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
        queryset = Campaign.objects.select_related("brand", "brand__user", "status_summary").prefetch_related("progress_steps")
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


class CampaignStatusSummaryViewSet(viewsets.ModelViewSet):
    serializer_class = CampaignStatusSummarySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = CampaignStatusSummary.objects.select_related("campaign", "campaign__brand", "campaign__brand__user")
        if self.request.user.role == UserRole.BRAND:
            return queryset.filter(campaign__brand__user=self.request.user)
        if self.request.user.role == UserRole.CREATOR:
            return queryset.filter(campaign__status=CampaignStatus.ACTIVE)
        return queryset

    def perform_create(self, serializer):
        campaign = serializer.validated_data["campaign"]
        if campaign.brand.user != self.request.user:
            raise PermissionDenied("You can only update status summaries for your own campaigns.")
        serializer.save()

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAuthenticated(), IsBrand()]
        return super().get_permissions()


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

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user.creator_profile)


class BrandShortlistViewSet(viewsets.ModelViewSet):
    serializer_class = BrandShortlistSerializer
    permission_classes = [IsAuthenticated, IsBrand]

    def get_queryset(self):
        return BrandShortlist.objects.select_related("brand", "creator", "creator__user").filter(brand__user=self.request.user)

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
                        "shortlisted_creators": BrandShortlist.objects.filter(brand=brand).count(),
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
                        "brand_shortlists": BrandShortlist.objects.filter(creator=creator).count(),
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
