from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.response import Response
from rest_framework.decorators import api_view

from .views import (
    signup,
    brand_login,
    creator_request_otp,
    creator_verify_otp,
    me,
    delete_account,
    brand_onboarding,
    brand_profile_details,
    brand_profile_social,
    brand_profile_images,
)

router = DefaultRouter()
# router.register("roles", RoleViewSet, basename="role")
# router.register("categories", CategoryViewSet, basename="category")
# router.register("tags", TagViewSet, basename="tag")
# router.register("brands", BrandViewSet, basename="brand")
# router.register("creators", CreatorViewSet, basename="creator")
# router.register("creator-platforms", CreatorPlatformViewSet, basename="creator-platform")
# router.register("campaigns", CampaignViewSet, basename="campaign")
# router.register("briefs", CampaignBriefViewSet, basename="brief")
# router.register("campaign-creators", CampaignCreatorViewSet, basename="campaign-creator")
# router.register("deliverables", DeliverableViewSet, basename="deliverable")
# router.register("reports", ReportViewSet, basename="report")
# router.register("invoices", InvoiceViewSet, basename="invoice")



urlpatterns = [
    path("auth/signup/<str:role>/", signup, name="signup"),
    path("auth/login/brand/", brand_login, name="brand-login"),
    path("auth/creator/request-otp/", creator_request_otp, name="creator-request-otp"),
    path("auth/creator/verify-otp/", creator_verify_otp, name="creator-verify-otp"),
    path("auth/me/", me, name="me"),
    path("auth/delete-account/", delete_account, name="delete-account"),
    path("brand-onboarding/", brand_onboarding, name="brand-onboarding"),
    path("brand-profile/details/", brand_profile_details, name="brand-profile-details"),
    path("brand-profile/social-media/", brand_profile_social, name="brand-profile-social-media"),
    path("brand-profile/images/", brand_profile_images, name="brand-profile-images"),
    path("", include(router.urls)),
]
