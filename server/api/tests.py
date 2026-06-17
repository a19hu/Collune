from datetime import timedelta

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .models import BrandProfile, Campaign, CreatorProfile, OtpChannel, OtpVerification, UserRole


class ColluneAuthTests(APITestCase):
    def verify_creator_otp(self, email="aakrit@example.com", phone="+919999944444"):
        for channel, target in [(OtpChannel.EMAIL, email), (OtpChannel.PHONE, phone)]:
            OtpVerification.objects.create(
                channel=channel,
                target=target,
                code="123456",
                is_verified=True,
                purpose="creator_registration",
                expires_at=timezone.now() + timedelta(minutes=10),
                verified_at=timezone.now(),
            )

    def test_creator_can_register_and_login(self):
        self.verify_creator_otp()
        response = self.client.post(
            reverse("creator_register"),
            {
                "user": {
                    "name": "Aakrit Gupta",
                    "email": "aakrit@example.com",
                    "phone_no": "+919999944444",
                    "password": "StrongPass123!",
                },
                "category": "Business & Finance",
                "audience_size": 120000,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["user"]["role"], UserRole.CREATOR)
        self.assertTrue(CreatorProfile.objects.filter(user__email="aakrit@example.com").exists())

        login = self.client.post(
            reverse("login"),
            {"username": "aakrit@example.com", "password": "StrongPass123!"},
            format="json",
        )
        self.assertEqual(login.status_code, status.HTTP_200_OK)
        self.assertIn("access", login.data)

    def test_brand_can_create_campaign(self):
        register = self.client.post(
            reverse("brand_register"),
            {
                "user": {
                    "name": "John Smith",
                    "email": "john@acme.test",
                    "password": "StrongPass123!",
                },
                "company_name": "Acme Labs",
                "industry": "Technology",
                "website": "https://acme.test",
            },
            format="json",
        )
        self.assertEqual(register.status_code, status.HTTP_201_CREATED)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {register.data['token']}")

        campaign = self.client.post(
            reverse("campaigns-list"),
            {
                "title": "Fintech Awareness",
                "brief": "Find finance creators who can explain investment products clearly.",
                "category": "Business & Finance",
                "budget_min": "25000.00",
                "budget_max": "40000.00",
                "status": "ACTIVE",
            },
            format="json",
        )

        self.assertEqual(campaign.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Campaign.objects.count(), 1)
        self.assertEqual(BrandProfile.objects.get().campaigns.count(), 1)
