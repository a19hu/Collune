"""Seed the AdminPermission catalog and default AdminRole rows.

Mirrors the RBAC catalog defined in the Admin React portal
(Admin/src/constants/permissions.ts) so the backend has a real, editable
schema for staff roles and permissions instead of hardcoded rules.
"""

from django.core.management.base import BaseCommand
from django.db import transaction

from ...models import AdminPermission, AdminRole

PERMISSIONS = [
    # Dashboard
    ("dashboard.view", "View Dashboard", "Dashboard",
     "Access the main dashboard, KPI metrics, and top-level analytics charts"),
    # Users
    ("users.view", "View Staff Users", "Users", "Browse internal staff members list and profile details"),
    ("users.create", "Create Staff User", "Users", "Add new staff user accounts to the platform"),
    ("users.edit", "Edit Staff User", "Users", "Modify staff profile, department, and account details"),
    ("users.delete", "Delete Staff User", "Users", "Permanently remove internal staff accounts"),
    ("users.activate", "Activate User", "Users", "Restore access to suspended or inactive staff"),
    ("users.deactivate", "Deactivate User", "Users", "Suspend or disable internal staff accounts"),
    ("users.export", "Export Users Data", "Users", "Download staff user directories in CSV/Excel format"),
    # Roles
    ("roles.view", "View Roles", "Roles", "Inspect roles and their associated permission matrices"),
    ("roles.create", "Create Role", "Roles", "Create custom roles with tailored permission lists"),
    ("roles.edit", "Edit Role", "Roles", "Modify existing role names, descriptions, and permission matrices"),
    ("roles.delete", "Delete Role", "Roles", "Delete custom roles not currently locked by the system"),
    ("roles.assign", "Assign Roles", "Roles", "Assign or reassign roles to staff members"),
    # Creators
    ("creators.view", "View Creators", "Creators", "Browse creator profiles, social metrics, and documents"),
    ("creators.create", "Create Creator", "Creators", "Manually register a new creator profile"),
    ("creators.edit", "Edit Creator", "Creators", "Modify creator details, social handles, and categories"),
    ("creators.verify", "Verify Creator Profile", "Creators", "Mark creator KYC and identity as verified badge"),
    ("creators.approve", "Approve Creator Application", "Creators", "Approve pending creator onboardings"),
    ("creators.reject", "Reject Creator Application", "Creators", "Reject fraudulent or non-compliant creator profiles"),
    ("creators.activate", "Activate Creator", "Creators", "Enable disabled or unblocked creator profiles"),
    ("creators.deactivate", "Deactivate Creator", "Creators", "Suspend or blacklist creator accounts"),
    ("creators.delete", "Delete Creator", "Creators", "Permanently remove creator records from platform"),
    ("creators.export", "Export Creator Data", "Creators", "Download creator lists, audience analytics, and contact info"),
    # Brands
    ("brands.view", "View Brands", "Brands", "Browse brand profiles, contact details, and campaigns"),
    ("brands.create", "Create Brand", "Brands", "Onboard new enterprise brands and advertisers"),
    ("brands.edit", "Edit Brand", "Brands", "Update brand contact information, billing, and settings"),
    ("brands.verify", "Verify Brand", "Brands", "Verify brand business registration documents & GST/Tax ID"),
    ("brands.approve", "Approve Brand", "Brands", "Approve brand onboarding applications"),
    ("brands.reject", "Reject Brand", "Brands", "Reject non-compliant brand registration applications"),
    ("brands.activate", "Activate Brand", "Brands", "Enable active status for brands"),
    ("brands.deactivate", "Deactivate Brand", "Brands", "Temporarily suspend brand account access"),
    ("brands.delete", "Delete Brand", "Brands", "Permanently remove brand accounts"),
    ("brands.export", "Export Brand Data", "Brands", "Download brand directory, spend histories, and campaign records"),
    # Campaigns
    ("campaigns.view", "View Campaigns", "Campaigns", "Inspect all active, completed, and draft campaigns"),
    ("campaigns.create", "Create Campaign", "Campaigns", "Launch new influencer marketing campaigns for brands"),
    ("campaigns.edit", "Edit Campaign", "Campaigns", "Modify campaign requirements, budgets, and timelines"),
    ("campaigns.approve", "Approve Campaign", "Campaigns", "Approve campaign briefs before public creator casting"),
    ("campaigns.pause", "Pause/Resume Campaign", "Campaigns", "Temporarily pause or restart active campaign deliverables"),
    ("campaigns.close", "Close Campaign", "Campaigns", "Mark campaigns as completed and finalize payouts"),
    ("campaigns.delete", "Delete Campaign", "Campaigns", "Permanently remove draft or test campaigns"),
    ("campaigns.export", "Export Campaign Data", "Campaigns", "Download campaign metrics, ROI, and deliverable stats"),
    # Shortlists
    ("shortlists.view", "View Shortlists", "Shortlists", "Browse brand shortlists, selected creators, and submission status"),
    ("shortlists.export", "Export Shortlist Data", "Shortlists", "Download shortlist records and selected creator rosters"),
    # Exports
    ("exports.view", "View Data Exports", "Exports", "Access the data export hub and view historical exports"),
    ("exports.creator", "Export Creator Datasets", "Exports", "Generate and download creator CSV/Excel datasets"),
    ("exports.brand", "Export Brand Datasets", "Exports", "Generate and download brand directory datasets"),
    ("exports.campaign", "Export Campaign Datasets", "Exports", "Generate and download campaign performance datasets"),
    ("exports.user", "Export Staff User Datasets", "Exports", "Generate and download internal staff rosters"),
]

ROLES = [
    {
        "name": "Super Admin",
        "description": "Full unrestricted platform access with all administrative privileges across all modules.",
        "is_wildcard": True,
        "is_system": True,
        "permissions": [],
    },
    {
        "name": "Admin",
        "description": "General system administration with broad operational and management access.",
        "permissions": [
            "dashboard.view",
            "users.view", "users.create", "users.edit", "users.activate", "users.deactivate", "users.export",
            "roles.view",
            "creators.view", "creators.create", "creators.edit", "creators.verify", "creators.approve",
            "creators.reject", "creators.activate", "creators.deactivate", "creators.export",
            "brands.view", "brands.create", "brands.edit", "brands.verify", "brands.approve", "brands.reject",
            "brands.activate", "brands.deactivate", "brands.export",
            "campaigns.view", "campaigns.create", "campaigns.edit", "campaigns.approve", "campaigns.pause",
            "campaigns.close", "campaigns.export",
            "shortlists.view", "shortlists.export",
            "exports.view", "exports.creator", "exports.brand", "exports.campaign", "exports.user",
        ],
    },
    {
        "name": "Operations Manager",
        "description": "Responsible for daily operations, managing creators, brands, and campaign workflows.",
        "permissions": [
            "dashboard.view",
            "creators.view", "creators.create", "creators.edit", "creators.verify", "creators.approve",
            "creators.reject", "creators.activate", "creators.deactivate", "creators.export",
            "brands.view", "brands.create", "brands.edit", "brands.verify", "brands.approve", "brands.reject",
            "brands.activate", "brands.deactivate", "brands.export",
            "campaigns.view", "campaigns.create", "campaigns.edit", "campaigns.approve", "campaigns.pause",
            "campaigns.close", "campaigns.export",
            "shortlists.view", "shortlists.export",
            "exports.view", "exports.creator", "exports.brand", "exports.campaign",
        ],
    },
    {
        "name": "Creator Manager",
        "description": "Focuses on creator discovery, onboarding, vetting, KYC verification, and support.",
        "permissions": [
            "dashboard.view",
            "creators.view", "creators.create", "creators.edit", "creators.verify", "creators.approve",
            "creators.reject", "creators.activate", "creators.deactivate",
            "campaigns.view",
            "brands.view",
        ],
    },
    {
        "name": "Campaign Manager",
        "description": "Coordinates end-to-end brand campaigns, creator casting, deliverable tracking, and execution.",
        "permissions": [
            "dashboard.view",
            "campaigns.view", "campaigns.create", "campaigns.edit", "campaigns.approve", "campaigns.pause",
            "campaigns.close",
            "shortlists.view",
            "creators.view",
            "brands.view",
        ],
    },
    {
        "name": "Brand Manager",
        "description": "Manages enterprise brand partnerships, account onboarding, billing profiles, and campaigns.",
        "permissions": [
            "dashboard.view",
            "brands.view", "brands.create", "brands.edit", "brands.verify", "brands.approve", "brands.reject",
            "brands.activate", "brands.deactivate",
            "campaigns.view", "campaigns.create", "campaigns.edit",
            "shortlists.view",
            "creators.view",
        ],
    },
    {
        "name": "Export Team",
        "description": "Read-only access across platform entities with high-volume data export capabilities.",
        "permissions": [
            "dashboard.view",
            "creators.view", "creators.export",
            "brands.view", "brands.export",
            "campaigns.view", "campaigns.export",
            "shortlists.view", "shortlists.export",
            "users.view", "users.export",
            "exports.view", "exports.creator", "exports.brand", "exports.campaign", "exports.user",
        ],
    },
    {
        "name": "Finance Manager",
        "description": "Oversees campaign budgets, payouts, brand invoices, and financial exports.",
        "permissions": [
            "dashboard.view",
            "brands.view",
            "campaigns.view",
            "creators.view",
            "exports.view", "exports.campaign", "exports.brand",
        ],
    },
    {
        "name": "Support Executive",
        "description": "Customer service staff with read-only visibility to resolve creator and brand inquiries.",
        "permissions": [
            "dashboard.view",
            "creators.view",
            "brands.view",
            "campaigns.view",
        ],
    },
]


class Command(BaseCommand):
    help = "Seed the AdminPermission catalog and default AdminRole rows used by the staff RBAC system."

    @transaction.atomic
    def handle(self, *args, **options):
        for key, label, module, description in PERMISSIONS:
            AdminPermission.objects.update_or_create(
                key=key,
                defaults={"label": label, "module": module, "description": description},
            )
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(PERMISSIONS)} admin permissions."))

        # Drop permissions no longer defined in the catalog (e.g. retired modules).
        stale = AdminPermission.objects.exclude(key__in=[key for key, *_ in PERMISSIONS])
        stale_count = stale.count()
        if stale_count:
            stale.delete()
            self.stdout.write(self.style.WARNING(f"Removed {stale_count} stale admin permissions."))

        for role_data in ROLES:
            role, _ = AdminRole.objects.update_or_create(
                name=role_data["name"],
                defaults={
                    "description": role_data["description"],
                    "is_wildcard": role_data.get("is_wildcard", False),
                    "is_system": role_data.get("is_system", False),
                },
            )
            perms = AdminPermission.objects.filter(key__in=role_data["permissions"])
            role.permissions.set(perms)
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(ROLES)} admin roles."))
