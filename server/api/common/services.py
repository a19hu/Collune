import json
import logging
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
logger = logging.getLogger(__name__)


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

def create_otp(channel, target, purpose="creator_registration"):
    normalized_target = normalize_otp_target(channel, target)
    code = get_random_string(6, allowed_chars=string.digits)
    OtpVerification.objects.filter(
        channel=channel,
        target=normalized_target,
        purpose=purpose,
        is_verified=False,
    ).delete()
    return OtpVerification.objects.create(
        channel=channel,
        target=normalized_target,
        code=code,
        purpose=purpose,
        expires_at=timezone.now() + timedelta(minutes=OTP_EXPIRY_MINUTES),
    )

def get_env(name, fallback=None):
    value = os.getenv(name)
    if value is None:
        return fallback
    value = value.strip()
    return value if value else fallback


def brevo_headers():
    api_key = get_env("BREVO_API_KEY") or get_env("BREVO_APIKEY")
    if not api_key:
        raise RuntimeError("BREVO_API_KEY is not configured.")
    return {
        "accept": "application/json",
        "api-key": api_key,
        "content-type": "application/json",
    }

def send_brevo_email_otp(target, code):
    sender_email = get_env("BREVO_EMAIL_SENDER") or get_env("DEFAULT_FROM_EMAIL")
    if not sender_email:
        raise RuntimeError("DEFAULT_FROM_EMAIL is not configured.")
    sender_name = get_env("BREVO_EMAIL_SENDER_NAME", "Collune")
    brevo_email_url = f"{BREVO_API_BASE}/smtp/email"

    html_content = f"""
        <!DOCTYPE html>
        <html>
            <body style="font-family: Arial, sans-serif;">
                <h2>Verify your Collune account</h2>

                <p>Your verification code is:</p>

                <div style="
                    font-size: 30px;
                    font-weight: bold;
                    letter-spacing: 8px;
                    margin: 20px 0;
                ">
                    {code}
                </div>

                <p>This code will expire shortly.</p>
                <p>Do not share this code with anyone.</p>

                <p>Regards,<br>Collune Team</p>
            </body>
        </html>
        """

    payload = {
            "sender": {
                "name": sender_name,
                "email": sender_email,
            },
            "to": [
                {
                    "email": target,
                    "name": target,
                }
            ],
            "subject": "Your Collune verification code",
            "htmlContent": html_content,
    }

    try:
        response = requests.post(
            brevo_email_url,
            json=payload,
            headers=brevo_headers(),
            timeout=20,
        )
        response.raise_for_status()
    except requests.HTTPError as error:
        body = error.response.text[:500] if error.response is not None else ""
        logger.error("Brevo email API rejected OTP send. status=%s body=%s", getattr(error.response, "status_code", "unknown"), body)
        raise
    except requests.RequestException:
        logger.exception("Brevo email API request failed.")
        raise

def send_aisensy_whatsapp_otp(target, code):
    api_key = get_env("AISENSY_API_KEY")
    if not api_key:
        raise RuntimeError("AISENSY_API_KEY is not configured.")

    code_text = str(code)

    payload = {
        "apiKey": api_key,
        "campaignName": get_env("AISENSY_CAMPAIGN_NAME", "collune_otp"),
        "destination": target,
        "userName": "Collune",
        "templateParams": [code_text],
        "source": get_env("AISENSY_SOURCE", "new-landing-page form"),
        "media": {},
        "buttons": [
            {
                "type": "button",
                "sub_type": "url",
                "index": 0,
                "parameters": [
                    {
                        "type": "text",
                        "text": code_text,
                    }
                ],
            }
        ],
        "carouselCards": [],
        "location": {},
        "attributes": {},
        "paramsFallbackValue": {
            "FirstName": get_env("AISENSY_FALLBACK_FIRST_NAME", "user"),
        },
    }

    response = requests.post(
        get_env("AISENSY_API_URL", "https://backend.aisensy.com/campaign/t1/api/v2"),
        json=payload,
        headers={"Content-Type": "application/json"},
        timeout=20,
    )
    try:
        response.raise_for_status()
    except requests.HTTPError as error:
        body = error.response.text[:500] if error.response is not None else ""
        logger.error(
            "AiSensy WhatsApp API rejected OTP send. status=%s body=%s",
            getattr(error.response, "status_code", "unknown"),
            body,
        )
        raise


def send_otp_message(otp):
    if otp.channel == OtpChannel.EMAIL:
        send_brevo_email_otp(otp.target, otp.code)
        return
    send_aisensy_whatsapp_otp(otp.target, otp.code)
