import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from ...admin.services import get_role_details
from ...management.commands.seed_admin_rbac import PERMISSIONS, ROLES
from ...models import AdminPermission, AdminRole, AdminRoleType, UserAdminRole, UserRole, VerificationStatus


class Command(BaseCommand):
    help = "Create a Django superuser from DJANGO_SUPERUSER_* environment variables."

    @transaction.atomic
    def handle(self, *args, **options):
        username = os.environ.get("DJANGO_SUPERUSER_USERNAME")
        email = os.environ.get("DJANGO_SUPERUSER_EMAIL", "")
        password = os.environ.get("DJANGO_SUPERUSER_PASSWORD")

        if not username or not password:
            self.stdout.write("DJANGO_SUPERUSER_* not set; skipping superuser creation.")
            return

        self._ensure_admin_rbac_seeded()

        User = get_user_model()
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": email,
                "role": UserRole.ADMIN,
                "verification_status": VerificationStatus.VERIFIED,
                "is_staff": True,
                "is_superuser": True,
                "is_active": True,
            },
        )

        if created:
            user.set_password(password)
            user.save(update_fields=["password"])
            self._ensure_super_admin_role_details(user)
            self.stdout.write(self.style.SUCCESS(f"Created superuser '{username}'."))
            return

        changed_fields = []
        if not user.is_staff:
            user.is_staff = True
            changed_fields.append("is_staff")
        if not user.is_superuser:
            user.is_superuser = True
            changed_fields.append("is_superuser")
        if not user.is_active:
            user.is_active = True
            changed_fields.append("is_active")
        if user.role != UserRole.ADMIN:
            user.role = UserRole.ADMIN
            changed_fields.append("role")
        if user.verification_status != VerificationStatus.VERIFIED:
            user.verification_status = VerificationStatus.VERIFIED
            changed_fields.append("verification_status")
        if email and user.email != email:
            user.email = email
            changed_fields.append("email")
        if os.environ.get("DJANGO_SUPERUSER_UPDATE_PASSWORD") == "true":
            user.set_password(password)
            changed_fields.append("password")

        if changed_fields:
            user.save(update_fields=changed_fields)

        self._ensure_super_admin_role_details(user)

        if changed_fields:
            self.stdout.write(self.style.SUCCESS(f"Updated superuser '{username}'."))
        else:
            self.stdout.write(f"Superuser '{username}' already exists.")

    def _ensure_admin_rbac_seeded(self):
        for key, label, module, description in PERMISSIONS:
            AdminPermission.objects.update_or_create(
                key=key,
                defaults={"label": label, "module": module, "description": description},
            )

        for role_data in ROLES:
            role, _ = AdminRole.objects.update_or_create(
                name=role_data["name"],
                defaults={
                    "description": role_data["description"],
                    "is_wildcard": role_data.get("is_wildcard", False),
                    "is_system": role_data.get("is_system", False),
                },
            )
            permissions = AdminPermission.objects.filter(key__in=role_data["permissions"])
            role.permissions.set(permissions)

    def _ensure_super_admin_role_details(self, user):
        assigned_role = AdminRole.objects.filter(name="Super Admin").first()
        role_details = get_role_details(AdminRoleType.SUPER_ADMIN)

        UserAdminRole.objects.update_or_create(
            user=user,
            defaults={
                "role_name": AdminRoleType.SUPER_ADMIN,
                "permissions": assigned_role.description if assigned_role else role_details["description"],
                "Purpose": role_details["purpose"],
                "assigned_role": assigned_role,
            },
        )
