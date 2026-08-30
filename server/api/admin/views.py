from django.contrib.auth.models import Permission
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import BrandProfile
from ..permissions import IsAdminUserRole
from .serializers import (
    AdminCampaignWriteSerializer,
    AdminCreatorWriteSerializer,
    AdminManagedUserSerializer,
    AdminRoleSerializer,
    AdminRoleWriteSerializer,
    AdminUserCreateSerializer,
    AdminUserUpdateSerializer,
)
from .services import (
    build_admin_dashboard_payload,
    build_role_templates,
    filter_admin_permissions,
    serialize_admin_brand,
    serialize_admin_campaign,
    serialize_admin_creator,
    serialize_admin_shortlist,
)
from ..models import (
    AdminRole, ApplicationStatus, BrandShortlist, Campaign, CreatorProfile, User, UserRole, VerificationStatus,
)

class VerificationView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def patch(self, request, profile_type, profile_id):
        model = BrandProfile if profile_type == "brands" else CreatorProfile if profile_type == "creators" else None
        if not model:
            return Response({"error": "Invalid profile type."}, status=status.HTTP_400_BAD_REQUEST)
        profile = model.objects.filter(pk=profile_id).first()
        if not profile:
            return Response({"error": "Profile not found."}, status=status.HTTP_404_NOT_FOUND)

        verification_value = request.data.get("verification_status")
        account_value = request.data.get("account_status")
        if verification_value is None and account_value is None:
            return Response(
                {"error": "'verification_status' or 'account_status' is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        update_fields = []
        if verification_value is not None:
            if verification_value not in VerificationStatus.values:
                return Response({"verification_status": ["Invalid verification status."]}, status=status.HTTP_400_BAD_REQUEST)
            profile.user.verification_status = verification_value
            update_fields.append("verification_status")
        if account_value is not None:
            normalized_account_value = str(account_value).upper()
            if normalized_account_value not in {"ACTIVE", "INACTIVE", "SUSPENDED"}:
                return Response({"account_status": ["Invalid account status."]}, status=status.HTTP_400_BAD_REQUEST)
            profile.user.is_active = normalized_account_value == "ACTIVE"
            update_fields.append("is_active")

        profile.user.save(update_fields=update_fields)
        profile.save(update_fields=["updated_at"])

        if profile_type == "creators":
            return Response({"profile": serialize_admin_creator(profile, request=request)})
        return Response({"profile": serialize_admin_brand(profile, request=request)})


class AdminDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        time_range = request.query_params.get("range", "30d")
        if time_range not in ("7d", "30d", "90d", "1y"):
            return Response({"range": ["Must be one of 7d, 30d, 90d, 1y."]}, status=status.HTTP_400_BAD_REQUEST)
        return Response(build_admin_dashboard_payload(time_range))


class AdminUserManagementView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get_queryset(self):
        return User.objects.filter(role=UserRole.ADMIN).select_related("role_details", "role_details__assigned_role").order_by("-created_at")

    def get_object(self, user_id):
        return self.get_queryset().filter(user_id=user_id).first()

    def get(self, request, user_id=None):
        if user_id:
            user = self.get_object(user_id)
            if not user:
                return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
            return Response({"user": AdminManagedUserSerializer(user).data})

        return Response({"data": AdminManagedUserSerializer(self.get_queryset(), many=True).data})

    def post(self, request):
        serializer = AdminUserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {"user": AdminManagedUserSerializer(user).data},
            status=status.HTTP_201_CREATED,
        )

    def patch(self, request, user_id):
        user = self.get_object(user_id)
        if not user:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = AdminUserUpdateSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({"user": AdminManagedUserSerializer(user).data})

    def delete(self, request, user_id):
        user = self.get_object(user_id)
        if not user:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminRoleListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        roles = AdminRole.objects.prefetch_related("permissions").order_by("name")
        return Response({"data": AdminRoleSerializer(roles, many=True).data})

    def post(self, request):
        serializer = AdminRoleWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        role = serializer.save()
        return Response({"role": AdminRoleSerializer(role).data}, status=status.HTTP_201_CREATED)


class AdminRoleDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get_object(self, role_id):
        return AdminRole.objects.filter(role_id=role_id).first()

    def patch(self, request, role_id):
        role = self.get_object(role_id)
        if not role:
            return Response({"error": "Role not found."}, status=status.HTTP_404_NOT_FOUND)
        if role.is_system:
            return Response({"error": "System roles cannot be edited."}, status=status.HTTP_400_BAD_REQUEST)
        serializer = AdminRoleWriteSerializer(role, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        role = serializer.save()
        return Response({"role": AdminRoleSerializer(role).data})

    def delete(self, request, role_id):
        role = self.get_object(role_id)
        if not role:
            return Response({"error": "Role not found."}, status=status.HTTP_404_NOT_FOUND)
        if role.is_system:
            return Response({"error": "System roles cannot be deleted."}, status=status.HTTP_400_BAD_REQUEST)

        staff = role.staff_members.select_related("user")
        count = staff.count()
        if count:
            unassign = str(request.query_params.get("unassign_staff", "")).lower() in ("1", "true", "yes")
            if not unassign:
                names = ", ".join(s.user.name or s.user.email for s in staff[:3])
                suffix = f" ({names}{', ...' if count > 3 else ''})"
                return Response(
                    {
                        "error": (
                            f"'{role.name}' is still assigned to {count} staff user(s){suffix}. "
                            "Reassign them to a different role first, or retry with unassign_staff=true."
                        ),
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            staff.update(assigned_role=None)

        role.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CampaignTableView(APIView):
    permission_classes = [IsAuthenticated,IsAdminUserRole]

    def get(self,request):
        campaigns = (
            Campaign.objects.select_related("brand")
            .prefetch_related("applications")
            .order_by("-created_at")
        )
        data = [serialize_admin_campaign(campaign, request=request) for campaign in campaigns]
        return Response({"data": data})

    def post(self, request):
        serializer = AdminCampaignWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        campaign = serializer.save()
        return Response(
            {"campaign": serialize_admin_campaign(campaign, request=request)},
            status=status.HTTP_201_CREATED,
        )


class AdminCampaignDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get_object(self, campaign_id):
        return (
            Campaign.objects.select_related("brand")
            .prefetch_related("applications")
            .filter(campaign_id=campaign_id)
            .first()
        )

    def get(self, request, campaign_id):
        campaign = self.get_object(campaign_id)
        if not campaign:
            return Response({"error": "Campaign not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response({"campaign": serialize_admin_campaign(campaign, request=request)})

    def patch(self, request, campaign_id):
        campaign = self.get_object(campaign_id)
        if not campaign:
            return Response({"error": "Campaign not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = AdminCampaignWriteSerializer(campaign, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        campaign = serializer.save()
        return Response({"campaign": serialize_admin_campaign(campaign, request=request)})

    def delete(self, request, campaign_id):
        campaign = self.get_object(campaign_id)
        if not campaign:
            return Response({"error": "Campaign not found."}, status=status.HTTP_404_NOT_FOUND)
        campaign.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ShortlistTableView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        shortlists = (
            BrandShortlist.objects.select_related("brand")
            .prefetch_related("creators__social_accounts")
            .order_by("-created_at")
        )
        data = [serialize_admin_shortlist(shortlist, request=request) for shortlist in shortlists]
        return Response({"data": data})


class AdminShortlistDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request, shortlist_id):
        shortlist = (
            BrandShortlist.objects.select_related("brand")
            .prefetch_related("creators__social_accounts")
            .filter(shortlist_id=shortlist_id)
            .first()
        )
        if not shortlist:
            return Response({"error": "Shortlist not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response({"shortlist": serialize_admin_shortlist(shortlist, request=request)})

    
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
        creators = (
            CreatorProfile.objects.select_related("user")
            .prefetch_related("social_accounts", "applications")
            .order_by("-created_at")
        )
        data = [serialize_admin_creator(creator, request=request) for creator in creators]
        return Response({"data": data})


class AdminCreatorDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get_object(self, creator_id):
        return (
            CreatorProfile.objects.select_related("user")
            .prefetch_related("social_accounts", "applications")
            .filter(creator_id=creator_id)
            .first()
        )

    def get(self, request, creator_id):
        creator = self.get_object(creator_id)
        if not creator:
            return Response({"error": "Creator not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response({"creator": serialize_admin_creator(creator, request=request)})

    def patch(self, request, creator_id):
        creator = self.get_object(creator_id)
        if not creator:
            return Response({"error": "Creator not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = AdminCreatorWriteSerializer(
            creator,
            data=request.data,
            partial=True,
            context={"creator": creator},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        refreshed_creator = self.get_object(creator_id)
        return Response({"creator": serialize_admin_creator(refreshed_creator, request=request)})


class BrandTableView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        brands = (
            BrandProfile.objects.select_related("user")
            .prefetch_related("campaigns")
            .order_by("-created_at")
        )
        data = [serialize_admin_brand(brand, request=request) for brand in brands]
        return Response({"data": data})


class AdminBrandDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request, brand_id):
        brand = (
            BrandProfile.objects.select_related("user")
            .prefetch_related("campaigns")
            .filter(brand_id=brand_id)
            .first()
        )
        if not brand:
            return Response({"error": "Brand not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response({"brand": serialize_admin_brand(brand, request=request)})
