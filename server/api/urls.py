from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .admin.views import VerificationView
from .brand.views import (
    BrandDetailDashboardView,
    BrandProfileViewSet,
    BrandRegisterView,
    BrandShortlistViewSet,
    CampaignsViewSet,
    CampaignViewSet,
)
from .common.views import (
    EmailAvailabilityView,
    LoginView,
    OtpSendView,
    OtpVerifyView,
    ProfileView,
    SignoutView,
)
from .creator.views import (
    CampaignApplicationViewSet,
    CreatorProfileView,
    CreatorRegisterView,
    FacebookCallbackView,
    FacebookConnectView,
    InstagramCallbackView,
    InstagramConnectView,
    XCallbackView,
    XConnectView,
    YouTubeCallbackView,
    YouTubeConnectView,
    YouTubeRefreshView,
    CreatorListViewSet,
    CreatorDashboardView,
    CampaignsListView,
    CreatorCampaignsView
)

router = DefaultRouter()
router.register("brands", BrandProfileViewSet, basename="brands")
router.register("campaigns", CampaignViewSet, basename="campaigns")
router.register("campaign-applications", CampaignApplicationViewSet, basename="campaign_applications")
router.register("brand-shortlists", BrandShortlistViewSet, basename="brand_shortlists")

urlpatterns = [
    path("auth/brands/register/", BrandRegisterView.as_view(), name="brand_register"),
    path("auth/creators/register/", CreatorRegisterView.as_view(), name="creator_register"),
    path("auth/email-availability/", EmailAvailabilityView.as_view(), name="email_availability"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/signout/", SignoutView.as_view(), name="signout"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/otp/send/", OtpSendView.as_view(), name="otp_send"),
    path("auth/otp/verify/", OtpVerifyView.as_view(), name="otp_verify"),
    path("auth/me/", ProfileView.as_view(), name="profile"),

    path("auth/creator/profile/", CreatorProfileView.as_view(), name="creator_profile"),

    path("brands/dashboard/", BrandDetailDashboardView.as_view(), name="brand_dashboard"),
    path("creators/dashboard/", CreatorDashboardView.as_view(), name="creator_dashboard"),
    path("creator/campaigns/", CampaignsListView.as_view(), name="creator_campaigns"),
    path("creator/campaignds/<uuid:campaign_id>/", CreatorCampaignsView.as_view(), name="creator_campaigns_profile"),


    path("brands/campaigns/", CampaignsViewSet.as_view(), name="brand_campaigns"),
    path("creators/list/", CreatorListViewSet.as_view(), name="creators_list"),
    path("creator/<uuid:creator_id>/", CreatorListViewSet.as_view(), name="creator_detail"),


    path("auth/instagram/connect/", InstagramConnectView.as_view(), name="instagram_connect"),
    path("auth/instagram/callback/", InstagramCallbackView.as_view(), name="instagram_callback"),
    path("auth/facebook/connect/", FacebookConnectView.as_view(), name="facebook_connect"),
    path("auth/facebook/callback/", FacebookCallbackView.as_view(), name="facebook_callback"),
    path("auth/youtube/connect/", YouTubeConnectView.as_view(), name="youtube_connect"),
    path("auth/youtube/callback/", YouTubeCallbackView.as_view(), name="youtube_callback"),
    path("auth/youtube/refresh/", YouTubeRefreshView.as_view(), name="youtube_refresh"),
    path("auth/x/connect/", XConnectView.as_view(), name="x_connect"),
    path("auth/x/callback/", XCallbackView.as_view(), name="x_callback"),



    path("verification/<str:profile_type>/<uuid:profile_id>/", VerificationView.as_view(), name="verification"),
   
   
    path("", include(router.urls)),
]
