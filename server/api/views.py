import json
import os
import secrets
import string

from django.contrib.auth import authenticate, get_user_model
from django.db import transaction
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


def generate_username(email):
    base = email.split("@", 1)[0].replace(".", "").replace("_", "")[:20] or "collune"
    candidate = base
    counter = 1
    while User.objects.filter(username=candidate).exists():
        counter += 1
        candidate = f"{base}{counter}"
    return candidate


def generate_password(length=10):
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return "".join(secrets.choice(alphabet) for _ in range(length))


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
    sender_email = os.getenv("BREVO_EMAIL_SENDER") or os.getenv("DEFAULT_FROM_EMAIL")
    if not sender_email:
        raise RuntimeError("BREVO_EMAIL_SENDER or DEFAULT_FROM_EMAIL is not configured.")
    payload = {
        "sender": {"name": os.getenv("BREVO_EMAIL_SENDER_NAME", "Collune"), "email": sender_email},
        "to": [{"email": target}],
        "subject": "Your Collune verification code",
        "htmlContent": f"<p>Your Collune verification code is <strong>{code}</strong>.</p><p>This code expires in {OTP_EXPIRY_MINUTES} minutes.</p>",
        "textContent": f"Your Collune verification code is {code}. This code expires in {OTP_EXPIRY_MINUTES} minutes.",
    }
    response = requests.post(f"{BREVO_API_BASE}/smtp/email", json=payload, headers=brevo_headers(), timeout=15)
    response.raise_for_status()


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
            return queryset.filter(status=CampaignStatus.ACTIVE, brand__verification_status=VerificationStatus.VERIFIED)
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
    permission_classes = [IsAuthenticated, IsBrand]

    def get_queryset(self):
        return CampaignStatusSummary.objects.select_related("campaign", "campaign__brand").filter(
            campaign__brand__user=self.request.user
        )

    def perform_create(self, serializer):
        campaign = serializer.validated_data["campaign"]
        if campaign.brand.user != self.request.user:
            raise PermissionDenied("You can only update status summaries for your own campaigns.")
        serializer.save()


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
