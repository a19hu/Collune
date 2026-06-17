from rest_framework.permissions import BasePermission

from .models import UserRole


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
