from collections.abc import Iterable

from django.contrib.auth.models import Permission

from ..models import UserAdminRole

EXCLUDED_PERMISSION_MODELS = {
    "session",
    "token",
    "contenttype",
    "tokenproxy",
    "permission",
    "group",
    "otpverification",
    "logentry"
}

ROLE_LABELS = dict(UserAdminRole._meta.get_field("role_name").choices)
ROLE_VALUES = tuple(ROLE_LABELS.keys())

ROLE_DETAILS = {
    "SUPER_ADMIN": {
        "label": "Super Admin",
        "purpose": "Owner / Founder",
        "description": "Full access, user management, billing, settings, delete, permissions, reports, API, and all modules.",
    },
    "ADMIN": {
        "label": "Admin",
        "purpose": "Company Administrator",
        "description": "Manage all modules except super-admin settings, create users, assign roles, and view reports.",
    },
    "OPERATIONS_MANAGER": {
        "label": "Operations Manager",
        "purpose": "Daily Operations",
        "description": "Manage projects, client assignments, approvals, reports, and day-to-day operations.",
    },
    "SALES_MARKETING_MANAGER": {
        "label": "Sales & Marketing Manager",
        "purpose": "Sales & Marketing",
        "description": "Handle CRM-style workflows, deals, campaigns, customer follow-up, and sales analytics.",
    },
    "PROJECT_MANAGER": {
        "label": "Project Manager",
        "purpose": "Project Delivery",
        "description": "Create projects, assign work, track progress, approve delivery, and communicate with clients.",
    },
    "ANALYTICS_MANAGER": {
        "label": "Analytics Manager",
        "purpose": "Reports & Insights",
        "description": "Read-only dashboards, analytics exports, and insight access.",
    },
    "TEAM_MEMBER": {
        "label": "Team Member / Executive",
        "purpose": "Employee",
        "description": "Assigned project access, attendance, documents, and profile updates.",
    },
}

ROLE_PERMISSION_RULES = {
    "SUPER_ADMIN": {"all_permissions": True},
    "ADMIN": {"all_permissions": True},
    "OPERATIONS_MANAGER": {
        "models": {"campaign", "brandshortlist", "brandprofile", "creatorprofile", "user"},
        "actions": {"add", "change", "delete", "view"},
    },
    "SALES_MARKETING_MANAGER": {
        "models": {"campaign", "brandprofile", "creatorprofile", "user"},
        "actions": {"view", "change"},
    },
    "PROJECT_MANAGER": {
        "models": {"campaign", "brandshortlist", "creatorprofile", "brandprofile"},
        "actions": {"add", "change", "view"},
    },
    "ANALYTICS_MANAGER": {
        "models": {"campaign", "brandshortlist", "brandprofile", "creatorprofile", "user"},
        "actions": {"view"},
    },
    "TEAM_MEMBER": {
        "models": {"campaign", "brandshortlist", "user"},
        "actions": {"view", "change"},
    },
}


def get_internal_admin_roles() -> tuple[str, ...]:
    return ROLE_VALUES


def get_role_details(role: str) -> dict:
    return ROLE_DETAILS[role]


def _matches_rule(permission: Permission, models: set[str], actions: set[str]) -> bool:
    codename = permission.codename.lower()
    action = codename.split("_", 1)[0]
    model_name = permission.content_type.model.lower()
    return action in actions and model_name in models


def filter_admin_permissions(permissions: Iterable[Permission]) -> list[Permission]:
    return [
        permission
        for permission in permissions
        if permission.content_type.model.lower() not in EXCLUDED_PERMISSION_MODELS
    ]


def get_default_permissions_for_role(role: str, permissions: Iterable[Permission] | None = None) -> list[Permission]:
    queryset = filter_admin_permissions(
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
    for role in get_internal_admin_roles():
        details = ROLE_DETAILS[role]
        role_permissions = get_default_permissions_for_role(role, permission_list)
        templates.append(
            {
                "role": role,
                "label": ROLE_LABELS.get(role, details["label"]),
                "purpose": details["purpose"],
                "description": details["description"],
                "permission_ids": [permission.id for permission in role_permissions],
                "permission_count": len(role_permissions),
            }
        )
    return templates
