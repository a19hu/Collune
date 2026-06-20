from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    BrandProfileViewSet,
    BrandRegisterView,
    BrandShortlistViewSet,
    CampaignApplicationViewSet,
    CampaignProgressViewSet,
    CampaignStatusSummaryViewSet,
    CampaignViewSet,
    CreatorProfileView,
    CreatorProfileViewSet,
    CreatorRegisterView,
    CreatorSocialAccountViewSet,
    DashboardSummaryView,
    EmailAvailabilityView,
    LoginView,
    OtpSendView,
    OtpVerifyView,
    ProfileView,
    SignoutView,
    VerificationView,
)

router = DefaultRouter()
router.register("brands", BrandProfileViewSet, basename="brands")
router.register("creators", CreatorProfileViewSet, basename="creators")
router.register("creator-social-accounts", CreatorSocialAccountViewSet, basename="creator_social_accounts")
router.register("campaigns", CampaignViewSet, basename="campaigns")
router.register("campaign-status-summaries", CampaignStatusSummaryViewSet, basename="campaign_status_summaries")
router.register("campaign-progress", CampaignProgressViewSet, basename="campaign_progress")
router.register("campaign-applications", CampaignApplicationViewSet, basename="campaign_applications")
router.register("brand-shortlists", BrandShortlistViewSet, basename="brand_shortlists")

urlpatterns = [
    path("auth/brands/register/", BrandRegisterView.as_view(), name="brand_register"),
    path("auth/creators/register/", CreatorRegisterView.as_view(), name="creator_register"),
    path("auth/email-availability/", EmailAvailabilityView.as_view(), name="email_availability"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/otp/send/", OtpSendView.as_view(), name="otp_send"),
    path("auth/otp/verify/", OtpVerifyView.as_view(), name="otp_verify"),
    path("auth/me/", ProfileView.as_view(), name="profile"),
    path("auth/creator/profile/", CreatorProfileView.as_view(), name="creator_profile"),
    path("auth/signout/", SignoutView.as_view(), name="signout"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("dashboard/summary/", DashboardSummaryView.as_view(), name="dashboard_summary"),
    path("verification/<str:profile_type>/<uuid:profile_id>/", VerificationView.as_view(), name="verification"),
    path("", include(router.urls)),
]
