import requests
import logging
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import (
    OtpVerification,
)
from .serializers import AuthUserSerializer, LoginSerializer, OtpSendSerializer, OtpVerifySerializer, PasswordResetRequestSerializer, PasswordResetConfirmSerializer
from .services import OTP_EXPIRY_MINUTES, OTP_MAX_ATTEMPTS, auth_response, create_otp, normalize_otp_target, send_otp_message

User = get_user_model()
logger = logging.getLogger(__name__)


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
        email = request.query_params.get("email")

        if not email:
            return Response(
                {"error": "Email is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        available = not User.objects.filter(email__iexact=email).exists()

        return Response({
            "email": email,
            "available": available,
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
        user_name = serializer.validated_data.get("userName")
        otp = create_otp(channel, target)
        try:
            send_otp_message(otp, user_name=user_name)
        except requests.RequestException as exc:
            otp.delete()
            logger.exception("OTP send failed for channel=%s target=%s", channel, target)
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


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        user = User.objects.filter(email__iexact=email).first()

        if user:
            otp = create_otp("EMAIL", email, purpose="password_reset")
            try:
                send_otp_message(otp)
            except requests.RequestException as exc:
                otp.delete()
                logger.exception("Password reset OTP send failed for email=%s", email)
                return Response(
                    {"error": "Could not send reset code through Brevo.", "detail": str(exc)},
                    status=status.HTTP_502_BAD_GATEWAY,
                )
            except RuntimeError as exc:
                otp.delete()
                return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(
            {
                "message": "If an account exists for this email, a reset code has been sent.",
                "email": email,
                "expires_in": OTP_EXPIRY_MINUTES * 60,
            },
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        code = serializer.validated_data["code"]
        new_password = serializer.validated_data["new_password"]

        otp = OtpVerification.objects.filter(
            channel="EMAIL",
            target=email,
            purpose="password_reset",
            is_verified=False,
        ).first()
        if not otp:
            return Response({"error": "No active reset code found."}, status=status.HTTP_400_BAD_REQUEST)
        if otp.expires_at <= timezone.now():
            return Response({"error": "Reset code has expired."}, status=status.HTTP_400_BAD_REQUEST)
        if otp.attempts >= OTP_MAX_ATTEMPTS:
            return Response({"error": "Too many reset attempts."}, status=status.HTTP_400_BAD_REQUEST)

        otp.attempts += 1
        if otp.code != code:
            otp.save(update_fields=["attempts"])
            return Response({"error": "Invalid reset code."}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email__iexact=email).first()
        if not user:
            otp.is_verified = True
            otp.verified_at = timezone.now()
            otp.save(update_fields=["attempts", "is_verified", "verified_at"])
            return Response({"message": "Password reset completed."}, status=status.HTTP_200_OK)

        user.set_password(new_password)
        user.save(update_fields=["password"])
        Token.objects.filter(user=user).delete()

        otp.is_verified = True
        otp.verified_at = timezone.now()
        otp.save(update_fields=["attempts", "is_verified", "verified_at"])

        return Response({"message": "Password reset completed."}, status=status.HTTP_200_OK)
