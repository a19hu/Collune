import requests
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import (
    BrandProfile, BrandShortlist, Campaign, CampaignApplication, CampaignStatus,
    CreatorProfile, CreatorSocialAccount, OtpVerification, UserRole,
)
from .serializers import AuthUserSerializer, EmailAvailabilitySerializer, LoginSerializer, OtpSendSerializer, OtpVerifySerializer
from .services import OTP_EXPIRY_MINUTES, OTP_MAX_ATTEMPTS, auth_response, create_otp, normalize_otp_target, send_otp_message

User = get_user_model()


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data.get("user")
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
