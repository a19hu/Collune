from django.contrib.auth.models import Permission
from django.db.models import Count, Q
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import BrandProfile
from ..permissions import IsAdminUserRole
from .serializers import AdminManagedUserSerializer, AdminPermissionSerializer, AdminUserCreateSerializer
from ..brand.serializers import BrandProfileSerializer
from ..creator.serializers import CreatorProfileSerializer
from ..models import (
    ApplicationStatus, BrandShortlist, Campaign, CreatorProfile, User, UserRole, VerificationStatus,
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


class PermissionTableView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        permissions = Permission.objects.select_related("content_type").order_by(
            "content_type__app_label",
            "content_type__model",
            "name",
        )
        return Response({"data": AdminPermissionSerializer(permissions, many=True).data})


class AdminUserManagementView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        users = (
            User.objects.exclude(role__in=[UserRole.BRAND, UserRole.CREATOR])
            .prefetch_related("user_permissions__content_type")
            .order_by("-created_at")
        )
        role = request.query_params.get("role")
        if role in UserRole.values:
            users = users.filter(role=role)
        return Response({"data": AdminManagedUserSerializer(users, many=True).data})

    def post(self, request):
        serializer = AdminUserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {"user": AdminManagedUserSerializer(user).data},
            status=status.HTTP_201_CREATED,
        )


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
    
class ShortlistTableView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        shortlists = (
            BrandShortlist.objects.select_related("brand")
            .annotate(creators_count=Count("creators", distinct=True))
            .order_by("-created_at")
        )

        data = [
            {
                "id": str(shortlist.shortlist_id),
                "brand_id": str(shortlist.brand.brand_id),
                "title": shortlist.title,
                "brand": shortlist.brand.company_name,
                "creators_count": shortlist.creators_count,
                "start_date": shortlist.start_date.isoformat() if shortlist.start_date else None,
                "end_date": shortlist.end_date.isoformat() if shortlist.end_date else None,
            }
            for shortlist in shortlists
        ]
        return Response({"data": data})
    
class UserTableView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request, user_role=UserRole.CREATOR):
        users = User.objects.filter(role=user_role).order_by("-created_at")

        data = [
            {
                "id": str(user.user_id),
                "name": user.name,
                "phone": user.phone_no or "",
                "visibility": user.is_profile_visible,
                "verification": user.verification_status,
            }
            for user in users
        ]
        return Response({"data": data})


class CreatorTableView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        creators = CreatorProfile.objects.select_related("user").order_by("-created_at")

        data = [
            {
                "id": str(creator.creator_id),
                "name": creator.display_name or creator.user.name or creator.user.username,
                "email": creator.user.email,
                "phone": creator.user.phone_no or "",
                "category": creator.category,
                "visibility": creator.user.is_profile_visible,
                "verification": creator.user.verification_status,
            }
            for creator in creators
        ]
        return Response({"data": data})


class BrandTableView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        brands = (
            BrandProfile.objects.select_related("user")
            .annotate(campaigns_count=Count("campaigns", distinct=True))
            .order_by("-created_at")
        )

        data = [
            {
                "id": str(brand.brand_id),
                "name": brand.company_name,
                "email": brand.user.email,
                "phone": brand.user.phone_no or "",
                "industry": brand.industry,
                "visibility": brand.user.is_profile_visible,
                "verification": brand.user.verification_status,
                "campaigns_count": brand.campaigns_count,
            }
            for brand in brands
        ]
        return Response({"data": data})


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
    
class AdminShortlistsView(APIView):
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
