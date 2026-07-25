from collections.abc import Iterable

from django.contrib.auth.models import Permission

from ..models import UserRole

ROLE_DETAILS = {
    UserRole.SUPER_ADMIN: {
        "label": "Super Admin",
        "purpose": "Owner / Founder",
        "description": "Full access, user management, billing, settings, delete, permissions, reports, API, and all modules.",
    },
    UserRole.ADMIN: {
        "label": "Admin",
        "purpose": "Company Administrator",
        "description": "Manage all modules except super-admin settings, create users, assign roles, and view reports.",
    },
    UserRole.OPERATIONS_MANAGER: {
        "label": "Operations Manager",
        "purpose": "Daily Operations",
        "description": "Manage projects, client assignments, approvals, reports, and day-to-day operations.",
    },
    UserRole.SALES_MARKETING_MANAGER: {
        "label": "Sales & Marketing Manager",
        "purpose": "Sales & Marketing",
        "description": "Handle CRM-style workflows, deals, campaigns, customer follow-up, and sales analytics.",
    },
    UserRole.PROJECT_MANAGER: {
        "label": "Project Manager",
        "purpose": "Project Delivery",
        "description": "Create projects, assign work, track progress, approve delivery, and communicate with clients.",
    },
    UserRole.ANALYTICS_MANAGER: {
        "label": "Analytics Manager",
        "purpose": "Reports & Insights",
        "description": "Read-only dashboards, analytics exports, and insight access.",
    },
    UserRole.TEAM_MEMBER: {
        "label": "Team Member / Executive",
        "purpose": "Employee",
        "description": "Assigned project access, attendance, documents, and profile updates.",
    },
}

ROLE_PERMISSION_RULES = {
    UserRole.SUPER_ADMIN: {"all_permissions": True},
    UserRole.ADMIN: {"all_permissions": True},
    UserRole.OPERATIONS_MANAGER: {
        "models": {"campaign", "brandshortlist", "brandprofile", "creatorprofile", "user"},
        "actions": {"add", "change", "delete", "view"},
    },
    UserRole.SALES_MARKETING_MANAGER: {
        "models": {"campaign", "brandprofile", "creatorprofile", "user"},
        "actions": {"view", "change"},
    },
    UserRole.PROJECT_MANAGER: {
        "models": {"campaign", "brandshortlist", "creatorprofile", "brandprofile"},
        "actions": {"add", "change", "view"},
    },
    UserRole.ANALYTICS_MANAGER: {
        "models": {"campaign", "brandshortlist", "brandprofile", "creatorprofile", "user"},
        "actions": {"view"},
    },
    UserRole.TEAM_MEMBER: {
        "models": {"campaign", "brandshortlist", "user"},
        "actions": {"view", "change"},
    },
}


def _matches_rule(permission: Permission, models: set[str], actions: set[str]) -> bool:
    codename = permission.codename.lower()
    action = codename.split("_", 1)[0]
    model_name = permission.content_type.model.lower()
    return action in actions and model_name in models


def get_default_permissions_for_role(role: str, permissions: Iterable[Permission] | None = None) -> list[Permission]:
    queryset = list(
        permissions
        if permissions is not None
        else Permission.objects.select_related("content_type").order_by("content_type__app_label", "content_type__model", "name")
    )
    rule = ROLE_PERMISSION_RULES.get(role, {})
    if rule.get("all_permissions"):
        return queryset
    models = set(rule.get("models", set()))
    actions = set(rule.get("actions", set()))
    return [permission for permission in queryset if _matches_rule(permission, models, actions)]


def build_role_templates(permissions: Iterable[Permission]) -> list[dict]:
    permission_list = list(permissions)
    templates = []
    for role in UserRole.internal_roles():
        details = ROLE_DETAILS[role]
        role_permissions = get_default_permissions_for_role(role, permission_list)
        templates.append(
            {
                "role": role,
                "label": details["label"],
                "purpose": details["purpose"],
                "description": details["description"],
                "permission_ids": [permission.id for permission in role_permissions],
                "permission_count": len(role_permissions),
            }
        )
    return templates
