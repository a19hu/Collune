from rest_framework.permissions import BasePermission


class RoleRequired(BasePermission):
    allowed_roles = set()

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        profile = getattr(user, "profile", None)
        if not profile or not profile.role_id:
            return False
        return profile.role.code in self.allowed_roles


class IsAdminLike(RoleRequired):
    allowed_roles = {"SUPER_ADMIN", "INTERNAL_ADMIN", "ANALYST", "MODERATOR"}


class IsBrandUser(RoleRequired):
    allowed_roles = {"BRAND_USER"}


class IsCreatorUser(RoleRequired):
    allowed_roles = {"CREATOR_USER"}
