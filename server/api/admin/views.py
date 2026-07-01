from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import BrandProfile, CreatorProfile, VerificationStatus
from ..permissions import IsAdminUserRole
from ..brand.serializers import BrandProfileSerializer
from ..creator.serializers import CreatorProfileSerializer


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
        profile.verification_status = status_value
        profile.save(update_fields=["verification_status", "updated_at"])
        serializer_class = BrandProfileSerializer if profile_type == "brands" else CreatorProfileSerializer
        return Response({"profile": serializer_class(profile, context={"request": request}).data})
