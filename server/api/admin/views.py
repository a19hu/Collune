from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count, Prefetch, Q

from ..models import BrandProfile, CreatorProfile, VerificationStatus
from ..permissions import IsAdminUserRole
from ..brand.serializers import BrandProfileSerializer
from ..creator.serializers import CreatorProfileSerializer
from ..models import (
    ApplicationStatus, Campaign, CampaignApplication, CreatorProfile, CreatorSavedCampaign, CreatorSocialAccount, SocialPlatform, UserRole, VerificationStatus,
)

class VerificationView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def patch(self, request, profile_type, profile_id):
        status_value = request.data.get("verification_status")
        if status_value not in VerificationStatus.values:
            return Response({"verification_status": ["Invalid verification status."]}, status=status.HTTP_400_BAD_REQUEST)
        model = BrandProfile if profile_type == "brands" else CreatorProfile if profile_type == "creators" else None
        if not model:
            return Response({"error": "Invalid profile type."}, status=status.HTTP_400_BAD_REQUEST)
        profile = model.objects.filter(pk=profile_id).first()
        if not profile:
            return Response({"error": "Profile not found."}, status=status.HTTP_404_NOT_FOUND)
        profile.user.verification_status = status_value
        profile.user.save(update_fields=["verification_status"])
        profile.save(update_fields=["updated_at"])
        serializer_class = BrandProfileSerializer if profile_type == "brands" else CreatorProfileSerializer
        return Response({"profile": serializer_class(profile, context={"request": request}).data})


class CampaignTableView(APIView):
    permission_classes = [IsAuthenticated,IsAdminUserRole]

    def get(self,request):
        campaigns = (
            Campaign.objects.select_related("brand")
            .annotate(
                applications_received_count=Count("applications", distinct=True),
                recommended_creators_count=Count(
                    "applications",
                    filter=Q(applications__status=ApplicationStatus.ACCEPTED),
                    distinct=True,
                ),
            )
            .order_by("-created_at")
        )

        data = [
            {
                "id": str(campaign.campaign_id),
                "brand_id": str(campaign.brand.brand_id),
                "title": campaign.title,
                'brand':campaign.brand.company_name,
                "applications_received_count":campaign.applications_received_count,
                "recommended_creators_count":campaign.recommended_creators_count
            }
            for campaign in campaigns
        ]
        return Response({"data":data})


class AdminCampaignsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request, campaign_id=None):

        campaign = Campaign.objects.select_related("brand").filter(
            campaign_id=campaign_id,
        ).first()
        if not campaign:
            return Response({"error": "Campaign not found."}, status=status.HTTP_404_NOT_FOUND)
        
        data = {
            "id": str(campaign.campaign_id),
            "title": campaign.title,
            "brief": campaign.brief,
            "objective": campaign.objective,
            "deliverables": campaign.deliverables,
            "creative_direction": campaign.creative_direction,
            "platforms": campaign.platforms,
            "category": campaign.category,
            "audience_type": campaign.audience_type,
            "location": campaign.location,
            "minimum_followers": campaign.minimum_followers,
            "language_preference": campaign.language_preference,
            "content_style": campaign.content_style,
            "brand_requirements": campaign.brand_requirements,
            "start_date": campaign.start_date.isoformat() if campaign.start_date else None,
            "end_date": campaign.end_date.isoformat() if campaign.end_date else None,
            "deadline": campaign.deadline.isoformat() if campaign.deadline else None,
            "posted_at": campaign.created_at.isoformat(),
            "brand_name": campaign.brand.company_name,
            "brand_type": campaign.brand.industry,
            "brand_logo": request.build_absolute_uri(campaign.brand.logo.url) if campaign.brand.logo else None,
            "creator_requirements": {
                "looking_for": campaign.category or campaign.brand_requirements,
                "audience": campaign.audience_type,
                "minimum_followers": campaign.minimum_followers,
                "languages": campaign.language_preference,
                "location": campaign.location,
                "content_style": campaign.content_style,
            },

        }
        return Response({"campaign": data})