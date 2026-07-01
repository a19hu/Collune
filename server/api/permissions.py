from rest_framework.permissions import BasePermission

from .models import UserRole, VerificationStatus


class HasRole(BasePermission):
    allowed_roles = ()
    message = "You do not have permission to perform this action."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in self.allowed_roles)


class IsAdminUserRole(HasRole):
    allowed_roles = (UserRole.ADMIN,)


class IsBrand(HasRole):
    allowed_roles = (UserRole.BRAND,)


class IsCreator(HasRole):
    allowed_roles = (UserRole.CREATOR,)


class IsVerifiedColluneMember(BasePermission):
    message = "Only verified Collune members can access platform data."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role == UserRole.ADMIN:
            return True
        if request.user.role == UserRole.BRAND:
            profile = getattr(request.user, "brand_profile", None)
            return bool(profile and profile.verification_status == VerificationStatus.VERIFIED)
        if request.user.role == UserRole.CREATOR:
            profile = getattr(request.user, "creator_profile", None)
            return bool(profile and profile.verification_status == VerificationStatus.VERIFIED)
        return False
