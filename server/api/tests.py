from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth.models import Permission
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
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

    def test_brand_logo_carousel_returns_only_id_and_logo(self):
        user = get_user_model().objects.create_user(
            username="logo-brand",
            email="logo@brand.test",
            password="StrongPass123!",
        )
        brand = BrandProfile.objects.create(
            user=user,
            company_name="Logo Brand",
            industry="Technology",
        )
        brand.logo = SimpleUploadedFile("logo.png", b"fake-image-content", content_type="image/png")
        brand.save(update_fields=["logo"])

        response = self.client.get(reverse("brand_logo_carousel"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("brands", response.data)
        self.assertEqual(len(response.data["brands"]), 1)
        self.assertEqual(set(response.data["brands"][0].keys()), {"id", "logo"})
        self.assertEqual(response.data["brands"][0]["id"], str(brand.brand_id))

    def test_brand_profile_view_returns_and_updates_brand_fields(self):
        user = get_user_model().objects.create_user(
            username="brand-profile-owner",
            email="brand.profile@test.com",
            password="StrongPass123!",
            role=UserRole.BRAND,
        )
        BrandProfile.objects.create(
            user=user,
            company_name="Acme Labs",
            industry="Technology",
            website="https://acme.test",
            company_size="11-50",
            linkedin_url="https://linkedin.com/company/acme",
        )
        self.client.force_authenticate(user=user)

        response = self.client.get(reverse("brand_profile"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["brand"]["company_name"], "Acme Labs")
        self.assertEqual(response.data["brand"]["industry"], "Technology")
        self.assertEqual(response.data["brand"]["website"], "https://acme.test")
        self.assertEqual(response.data["brand"]["company_size"], "11-50")
        self.assertEqual(response.data["brand"]["linkedin_url"], "https://linkedin.com/company/acme")

        patch_response = self.client.patch(
            reverse("brand_profile"),
            {
                "company_name": "Acme Global",
                "industry": "Fintech",
                "company_size": "51-200",
                "is_profile_visible": False,
            },
            format="json",
        )

        self.assertEqual(patch_response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        brand = user.brand_profile
        self.assertEqual(brand.company_name, "Acme Global")
        self.assertEqual(brand.industry, "Fintech")
        self.assertEqual(brand.company_size, "51-200")
        self.assertFalse(user.is_profile_visible)

    def test_public_brand_profile_view_returns_visible_brand(self):
        user = get_user_model().objects.create_user(
            username="public-brand",
            email="public.brand@test.com",
            password="StrongPass123!",
            role=UserRole.BRAND,
            verification_status="VERIFIED",
            is_profile_visible=True,
        )
        brand = BrandProfile.objects.create(
            user=user,
            company_name="Public Brand",
            industry="Retail",
            website="https://public-brand.test",
            company_size="201-500",
            linkedin_url="https://linkedin.com/company/public-brand",
        )

        response = self.client.get(reverse("brand_detail", args=[brand.brand_id]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["brand"]["brand_id"], str(brand.brand_id))
        self.assertEqual(response.data["brand"]["company_name"], "Public Brand")
        self.assertEqual(response.data["brand"]["industry"], "Retail")
        self.assertTrue(response.data["brand"]["verified"])
        self.assertNotIn("user", response.data["brand"])

    def test_admin_can_create_internal_user_with_role_template_and_permissions(self):
        admin = get_user_model().objects.create_user(
            username="admin-user-manager",
            email="admin.manager@test.com",
            password="StrongPass123!",
            role=UserRole.ADMIN,
        )
        self.client.force_authenticate(user=admin)
        permission = Permission.objects.get(codename="view_campaign")

        response = self.client.post(
            reverse("admin_users_table"),
            {
                "name": "Managed User",
                "email": "managed.user@test.com",
                "phone_no": "+15551234567",
                "password": "StrongPass123!",
                "role": UserRole.OPERATIONS_MANAGER,
                "permissions": [permission.id],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["user"]["role"], UserRole.OPERATIONS_MANAGER)
        self.assertEqual(response.data["user"]["email"], "managed.user@test.com")
        self.assertIn("view_campaign", [item["codename"] for item in response.data["user"]["permissions"]])

    def test_admin_permissions_table_hides_internal_models(self):
        admin = get_user_model().objects.create_user(
            username="admin-permissions-manager",
            email="admin.permissions@test.com",
            password="StrongPass123!",
            role=UserRole.ADMIN,
        )
        self.client.force_authenticate(user=admin)

        response = self.client.get(reverse("admin_permissions_table"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        hidden_models = {"session", "token", "contenttype", "tokenproxy", "permission", "group", "otpverification"}
        response_models = {item["model"] for item in response.data["data"]}
        self.assertTrue(hidden_models.isdisjoint(response_models))

    def test_public_lists_respect_profile_visibility(self):
        visible_brand_response = self.client.post(
            reverse("brand_register"),
            {
                "user": {
                    "name": "Visible Brand",
                    "email": "visible@brand.test",
                    "password": "StrongPass123!",
                },
                "company_name": "Visible Brand",
                "industry": "Technology",
            },
            format="json",
        )
        hidden_brand_response = self.client.post(
            reverse("brand_register"),
            {
                "user": {
                    "name": "Hidden Brand",
                    "email": "hidden@brand.test",
                    "password": "StrongPass123!",
                },
                "company_name": "Hidden Brand",
                "industry": "Finance",
            },
            format="json",
        )
        hidden_brand = BrandProfile.objects.get(brand_id=hidden_brand_response.data["brand"]["brand_id"])
        hidden_brand.is_profile_visible = False
        hidden_brand.save(update_fields=["is_profile_visible"])

        self.verify_creator_otp(email="visible.creator@example.com", phone="+919999944441")
        visible_creator_response = self.client.post(
            reverse("creator_register"),
            {
                "user": {
                    "name": "Visible Creator",
                    "email": "visible.creator@example.com",
                    "phone_no": "+919999944441",
                    "password": "StrongPass123!",
                },
                "category": "Lifestyle",
            },
            format="json",
        )
        visible_creator = CreatorProfile.objects.get(creator_id=visible_creator_response.data["creator"]["creator_id"])
        visible_creator.verification_status = "VERIFIED"
        visible_creator.save(update_fields=["verification_status"])

        self.verify_creator_otp(email="hidden.creator@example.com", phone="+919999944442")
        hidden_creator_response = self.client.post(
            reverse("creator_register"),
            {
                "user": {
                    "name": "Hidden Creator",
                    "email": "hidden.creator@example.com",
                    "phone_no": "+919999944442",
                    "password": "StrongPass123!",
                },
                "category": "Education",
            },
            format="json",
        )
        hidden_creator = CreatorProfile.objects.get(creator_id=hidden_creator_response.data["creator"]["creator_id"])
        hidden_creator.verification_status = "VERIFIED"
        hidden_creator.is_profile_visible = False
        hidden_creator.save(update_fields=["verification_status", "is_profile_visible"])

        public_brands = self.client.get(reverse("brands_list"))
        public_creators = self.client.get(reverse("creators_list"))

        self.assertIn(public_brands.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))
        self.assertIn(public_creators.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))

        self.client.credentials(HTTP_AUTHORIZATION=f"Token {visible_brand_response.data['token']}")
        brands = self.client.get(reverse("brands_list"))
        creators = self.client.get(reverse("creators_list"))

        self.assertEqual(brands.status_code, status.HTTP_200_OK)
        self.assertEqual(creators.status_code, status.HTTP_200_OK)
        self.assertEqual([brand["brand_id"] for brand in brands.data["brands"]], [visible_brand_response.data["brand"]["brand_id"]])
        self.assertEqual([creator["creator_id"] for creator in creators.data["creators"]], [visible_creator_response.data["creator"]["creator_id"]])

    @patch.dict(
        "os.environ",
        {
            "BREVO_API_KEY": "test-api-key",
            "BREVO_EMAIL_SENDER": "noreply@example.com",
        },
    )
    @patch("api.views.requests.post")
    def test_email_otp_send_and_verify_for_iitj_email(self, mock_post):
        mock_post.return_value.raise_for_status.return_value = None
        target = "b22cs015@iitj.ac.in"

        send_response = self.client.post(
            reverse("otp_send"),
            {"channel": OtpChannel.EMAIL, "target": target},
            format="json",
        )

        self.assertEqual(send_response.status_code, status.HTTP_200_OK)
        self.assertEqual(send_response.data["target"], target)
        otp = OtpVerification.objects.get(channel=OtpChannel.EMAIL, target=target)
        self.assertFalse(otp.is_verified)
        payload = mock_post.call_args.kwargs["json"]
        self.assertEqual(payload["to"][0]["email"], target)
        self.assertIn(otp.code, payload["textContent"])

        verify_response = self.client.post(
            reverse("otp_verify"),
            {"channel": OtpChannel.EMAIL, "target": target, "code": otp.code},
            format="json",
        )

        self.assertEqual(verify_response.status_code, status.HTTP_200_OK)
        otp.refresh_from_db()
        self.assertTrue(otp.is_verified)
