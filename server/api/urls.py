from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.response import Response
from rest_framework.decorators import api_view

from .views import (
    signup,
    me,
    delete_account,
    brands_signup,
    brand_onboarding,
    RoleViewSet,
    CategoryViewSet,
    TagViewSet,
    BrandViewSet,
    CreatorViewSet,
    CreatorPlatformViewSet,
    CampaignViewSet,
    CampaignBriefViewSet,
    CampaignCreatorViewSet,
    DeliverableViewSet,
    AnalyticsSnapshotViewSet,
    ReportViewSet,
    InvoiceViewSet,
    PayoutViewSet,
    NotificationViewSet,
    ChatRoomViewSet,
    ChatMessageViewSet,
    AIInteractionViewSet,
)

router = DefaultRouter()
router.register("roles", RoleViewSet, basename="role")
router.register("categories", CategoryViewSet, basename="category")
router.register("tags", TagViewSet, basename="tag")
router.register("brands", BrandViewSet, basename="brand")
router.register("creators", CreatorViewSet, basename="creator")
router.register("creator-platforms", CreatorPlatformViewSet, basename="creator-platform")
router.register("campaigns", CampaignViewSet, basename="campaign")
router.register("briefs", CampaignBriefViewSet, basename="brief")
router.register("campaign-creators", CampaignCreatorViewSet, basename="campaign-creator")
router.register("deliverables", DeliverableViewSet, basename="deliverable")
router.register("analytics-snapshots", AnalyticsSnapshotViewSet, basename="analytics-snapshot")
router.register("reports", ReportViewSet, basename="report")
router.register("invoices", InvoiceViewSet, basename="invoice")
router.register("payouts", PayoutViewSet, basename="payout")
router.register("notifications", NotificationViewSet, basename="notification")
router.register("chat-rooms", ChatRoomViewSet, basename="chat-room")
router.register("chat-messages", ChatMessageViewSet, basename="chat-message")
router.register("ai-interactions", AIInteractionViewSet, basename="ai-interaction")



urlpatterns = [
    path("auth/signup/", signup, name="signup"),
    path("auth/signup-brand/", brands_signup, name="brand-signup"),
    path("auth/me/", me, name="me"),
    path("auth/delete-account/", delete_account, name="delete-account"),
    path("brand-onboarding/", brand_onboarding, name="brand-onboarding"),
    path("", include(router.urls)),
]
