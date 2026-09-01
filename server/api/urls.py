from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .admin.views import (
    AdminBrandDetailView,
    AdminCampaignDetailView,
    AdminCreatorDetailView,
    AdminDashboardView,
    AdminRoleDetailView,
    AdminRoleListView,
    AdminShortlistDetailView,
    AdminUserManagementView,
    BrandTableView,
    CampaignTableView,
    CreatorTableView,
    ShortlistTableView,
    VerificationView,
)
from .brand.views import (
    BrandDetailDashboardView,
    BrandLogoCarouselView,
    BrandProfileView,
    BrandProfileViewSet,
    BrandRegisterView,
    BrandSavedCreatorView,
    BrandCampaignApplicationViewSet,
    CampaignReviewView,
    CampaignsViewSet,
    PublicBrandProfileView,
    CampaignViewSet,
    ShortlistViewSet,
)
from .common.views import (
    EmailAvailabilityView,
    LoginView,
    OtpSendView,
    OtpVerifyView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    ProfileView,
    SignoutView,
)
from .notification.views import NotificationListView, NotificationReadView
from .chat.views import ChatConversationListCreateView, ChatConversationReadView, ChatMessageListCreateView
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
    CreatorCampaignsView,
    CreatorAppliedCampaignsView,
    CreatorSavedCampaignView,
)

router = DefaultRouter()
router.register("brands", BrandProfileViewSet, basename="brands")
router.register("campaigns", CampaignViewSet, basename="campaigns")

urlpatterns = [
    path("auth/brands/register/", BrandRegisterView.as_view(), name="brand_register"),
    path("auth/creators/register/", CreatorRegisterView.as_view(), name="creator_register"),
    path("auth/email-availability/", EmailAvailabilityView.as_view(), name="email_availability"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/signout/", SignoutView.as_view(), name="signout"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/otp/send/", OtpSendView.as_view(), name="otp_send"),
    path("auth/otp/verify/", OtpVerifyView.as_view(), name="otp_verify"),
    path("auth/password-reset/request/", PasswordResetRequestView.as_view(), name="password_reset_request"),
    path("auth/password-reset/confirm/", PasswordResetConfirmView.as_view(), name="password_reset_confirm"),
    path("auth/me/", ProfileView.as_view(), name="profile"),
    path("notifications/", NotificationListView.as_view(), name="notifications_list"),
    path("notifications/read/", NotificationReadView.as_view(), name="notifications_read"),
    path("chat/conversations/", ChatConversationListCreateView.as_view(), name="chat_conversations"),
    path("chat/conversations/<uuid:conversation_id>/messages/", ChatMessageListCreateView.as_view(), name="chat_messages"),
    path("chat/conversations/<uuid:conversation_id>/read/", ChatConversationReadView.as_view(), name="chat_read"),

    path("auth/brand/profile/", BrandProfileView.as_view(), name="brand_profile"),
    path("auth/creator/profile/", CreatorProfileView.as_view(), name="creator_profile"),

    path("brands/dashboard/", BrandDetailDashboardView.as_view(), name="brand_dashboard"),
    path("brands/logo-carousel/", BrandLogoCarouselView.as_view(), name="brand_logo_carousel"),
    path("creators/dashboard/", CreatorDashboardView.as_view(), name="creator_dashboard"),
    path("creator/campaigns/", CampaignsListView.as_view(), name="creator_campaigns"),
    path("creator/campaignds/<uuid:campaign_id>/", CreatorCampaignsView.as_view(), name="creator_campaigns_profile"),
    path("creator/applied-campaigns/", CreatorAppliedCampaignsView.as_view(), name="creator_applied_campaigns"),
    path("creator/saved-campaigns/", CreatorSavedCampaignView.as_view(), name="creator_saved_campaigns"),
    path("campaign-applications/", CampaignApplicationViewSet.as_view(), name="campaign_applications"),


    path("brands/campaigns/", CampaignsViewSet.as_view(), name="brand_campaigns"),
    path("brands/campaigns/review/", CampaignReviewView.as_view(), name="brand_campaign_review"),
    path("brands/campaigns/<uuid:campaign_id>/", BrandCampaignApplicationViewSet.as_view(), name="brand_campaign_detail"),
    path("brand-shortlists/", ShortlistViewSet.as_view(), name="brand_shortlists"),
    path("brand-shortlists/<uuid:shortlist_id>/", ShortlistViewSet.as_view(), name="brand_shortlist_detail"),
    path("brand/<uuid:brand_id>/", PublicBrandProfileView.as_view(), name="brand_detail"),
    path("creators/list/", CreatorListViewSet.as_view(), name="creators_list"),
    path("creator/<uuid:creator_id>/", CreatorListViewSet.as_view(), name="creator_detail"),
    path("brand/saved-creators/", BrandSavedCreatorView.as_view(), name="brand_saved_creators"),



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
    path("admin/brands/", BrandTableView.as_view(), name="admin_brands_table"),
    path("admin/brands/<uuid:brand_id>/", AdminBrandDetailView.as_view(), name="admin_brand_detail"),
    path("admin/campaigns/", CampaignTableView.as_view(), name="admin_campaigns_table"),
    path("admin/campaigns/<uuid:campaign_id>/", AdminCampaignDetailView.as_view(), name="admin_campaign_detail"),
    path("admin/creators/", CreatorTableView.as_view(), name="admin_creators_table"),
    path("admin/creators/<uuid:creator_id>/", AdminCreatorDetailView.as_view(), name="admin_creator_detail"),
    path("admin/shortlists/", ShortlistTableView.as_view(), name="admin_shortlists_table"),
    path("admin/shortlists/<uuid:shortlist_id>/", AdminShortlistDetailView.as_view(), name="admin_shortlist_detail"),
    path("admin/users/", AdminUserManagementView.as_view(), name="admin_users_table"),
    path("admin/users/<uuid:user_id>/", AdminUserManagementView.as_view(), name="admin_user_detail"),
    path("admin/roles/", AdminRoleListView.as_view(), name="admin_roles_table"),
    path("admin/roles/<uuid:role_id>/", AdminRoleDetailView.as_view(), name="admin_role_detail"),
    path("admin/dashboard/", AdminDashboardView.as_view(), name="admin_dashboard"),

   
   
    path("", include(router.urls)),
]
