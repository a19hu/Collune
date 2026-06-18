import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Create a Django superuser from DJANGO_SUPERUSER_* environment variables."

    def handle(self, *args, **options):
        username = "a19hu"
        email = "a@gmail.com"
        password = "a19hu"

        if not username and not password:
            self.stdout.write("DJANGO_SUPERUSER_* not set; skipping superuser creation.")
            return

        if not username or not password:
            raise CommandError(
                "Both DJANGO_SUPERUSER_USERNAME and DJANGO_SUPERUSER_PASSWORD are required."
            )

        User = get_user_model()
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": email,
                "is_staff": True,
                "is_superuser": True,
            },
        )

        if created:
            user.set_password(password)
            user.save(update_fields=["password"])
            self.stdout.write(self.style.SUCCESS(f"Created superuser '{username}'."))
            return

        changed_fields = []
        if not user.is_staff:
            user.is_staff = True
            changed_fields.append("is_staff")
        if not user.is_superuser:
            user.is_superuser = True
            changed_fields.append("is_superuser")
        if email and user.email != email:
            user.email = email
            changed_fields.append("email")
        if os.environ.get("DJANGO_SUPERUSER_UPDATE_PASSWORD") == "true":
            user.set_password(password)
            changed_fields.append("password")

        if changed_fields:
            user.save(update_fields=changed_fields)
            self.stdout.write(self.style.SUCCESS(f"Updated superuser '{username}'."))
        else:
            self.stdout.write(f"Superuser '{username}' already exists.")
