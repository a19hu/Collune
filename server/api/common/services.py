import json
import os
import string
from datetime import timedelta

import requests
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.utils import timezone
from django.utils.crypto import get_random_string
from rest_framework.authtoken.models import Token
from rest_framework_simplejwt.tokens import RefreshToken

from ..models import OtpChannel, OtpVerification, UserRole

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
        "id": str(user.user_id),
        "name": user.name or user.profile_name,
        "email": user.email,
        "role": role_map.get(user.role, user.role),
        "verification_status":user.verification_status
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
