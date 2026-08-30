from collections.abc import Iterable
from datetime import timedelta

from dateutil.relativedelta import relativedelta
from django.contrib.auth.models import Permission
from django.db.models import Count, Sum
from django.utils import timezone

from ..models import (
    ApplicationStatus,
    BrandProfile,
    Campaign,
    CampaignApplication,
    CampaignStatus,
    CreatorProfile,
    User,
    UserAdminRole,
    UserRole,
    VerificationStatus,
)

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

VERIFICATION_STATUS_LABELS = {
    "VERIFIED": "Verified",
    "PENDING": "Pending",
    "REJECTED": "Rejected",
    "UNVERIFIED": "Unverified",
}

ACCOUNT_STATUS_LABELS = {
    "ACTIVE": "Active",
    "INACTIVE": "Inactive",
    "SUSPENDED": "Suspended",
}


def _account_status_label(user):
    return ACCOUNT_STATUS_LABELS["ACTIVE"] if user.is_active else ACCOUNT_STATUS_LABELS["INACTIVE"]

SOCIAL_PLATFORM_LABELS = {
    "INSTAGRAM": "Instagram",
    "YOUTUBE": "YouTube",
    "X": "X",
    "FACEBOOK": "Facebook",
}




def _format_creator_location(creator):
    parts = []
    for part in [creator.city, creator.state, creator.country]:
        normalized = str(part or "").strip()
        if normalized and normalized not in parts:
            parts.append(normalized)
    if parts:
        return ", ".join(parts)

    raw_location = str(creator.location or "").strip()
    if not raw_location:
        return ""

    structured_parts = []
    for segment in raw_location.split("|"):
        cleaned = segment.strip()
        if ":" in cleaned:
            _, cleaned = cleaned.split(":", 1)
        cleaned = cleaned.strip()
        if cleaned and cleaned not in structured_parts:
            structured_parts.append(cleaned)
    return ", ".join(structured_parts) if structured_parts else raw_location

def serialize_admin_creator(creator, request=None):
    """Map a CreatorProfile into the shape the Admin portal's Creator type expects."""
    accounts = list(creator.social_accounts.all())
    total_followers = sum(account.followers for account in accounts)
    primary_engagement = max((account.engagement_rate for account in accounts), default=0)
    completed_campaigns = (
        creator.applications.filter(status=ApplicationStatus.ACCEPTED)
        .values("campaign_id")
        .distinct()
        .count()
    )

    avatar_url = ""
    if creator.profile_image:
        avatar_url = request.build_absolute_uri(creator.profile_image.url) if request else creator.profile_image.url

    handle_source = accounts[0].username or accounts[0].handle if accounts else (creator.display_name or "")
    handle = f"@{handle_source.lstrip('@').replace(' ', '').lower()}" if handle_source else ""

    return {
        "id": str(creator.creator_id),
        "name": creator.display_name or creator.user.name or creator.user.username,
        "handle": handle,
        "email": creator.user.email,
        "phone": creator.user.phone_no or "",
        "avatarUrl": avatar_url,
        "bio": creator.bio,
        "about": creator.about,
        "category": creator.category,
        "languages": creator.languages or [],
        "collaborationPreferences": creator.collaboration_preferences or [],
        "workWith": creator.work_with or [],
        "location": _format_creator_location(creator),
        "city": creator.city,
        "country": creator.country,
        "state": creator.state,
        "district": creator.district,
        "postalCode": creator.postal_code,
        "streetAddress": creator.street_address,
        "gender": creator.gender,
        "displayName": creator.display_name,
        "isProfileVisible": creator.user.is_profile_visible,
        "totalFollowers": total_followers,
        "primaryEngagementRate": round(primary_engagement, 1),
        "verificationStatus": VERIFICATION_STATUS_LABELS.get(creator.user.verification_status, "Unverified"),
        "accountStatus": _account_status_label(creator.user),
        "socials": [
            {
                "platform": SOCIAL_PLATFORM_LABELS.get(account.platform, account.platform.title()),
                "handle": f"@{(account.username or account.handle).lstrip('@')}",
                "followers": account.followers,
                "engagementRate": account.engagement_rate,
                "url": account.url,
            }
            for account in accounts
        ],
        "completedCampaigns": completed_campaigns,
        "joinedAt": creator.created_at.isoformat(),
        "documents": [],
        # Legacy fields kept for the older client Admin panel (client/src/components/Admin/AdminCreators.tsx)
        "visibility": creator.user.is_profile_visible,
        "verification": creator.user.verification_status,
    }


SHORTLIST_STATUS_LABELS = {
    "DRAFT": "Draft",
    "SUBMITTED": "Submitted",
}


def _creator_ref(creator):
    account = creator.social_accounts.first()
    return {
        "id": str(creator.creator_id),
        "name": creator.display_name or creator.user.name or creator.user.username,
        "avatarUrl": creator.profile_image.url if creator.profile_image else "",
        "category": creator.category,
        "platform": SOCIAL_PLATFORM_LABELS.get(account.platform, "Instagram") if account else "Instagram",
        "followers": account.followers if account else 0,
    }


def serialize_admin_shortlist(shortlist, request=None):
    """Map a BrandShortlist into the shape the Admin portal's Shortlist type expects."""
    creators = list(shortlist.creators.select_related("user").prefetch_related("social_accounts").all())
    brand_logo = ""
    if shortlist.brand.logo:
        brand_logo = request.build_absolute_uri(shortlist.brand.logo.url) if request else shortlist.brand.logo.url

    return {
        "id": str(shortlist.shortlist_id),
        "shortlistCode": f"SL-{str(shortlist.shortlist_id)[:8].upper()}",
        "title": shortlist.title,
        "brandId": str(shortlist.brand.brand_id),
        "brandName": shortlist.brand.company_name,
        "brandLogo": brand_logo,
        "status": SHORTLIST_STATUS_LABELS.get(shortlist.status, "Draft"),
        "purpose": shortlist.purpose,
        "notes": shortlist.notes,
        "platforms": [SOCIAL_PLATFORM_LABELS.get(p, p) for p in (shortlist.platforms or [])],
        "categories": shortlist.categories,
        "audience": shortlist.audience,
        "budgetRange": shortlist.budget_range,
        "startDate": shortlist.start_date.isoformat() if shortlist.start_date else "",
        "endDate": shortlist.end_date.isoformat() if shortlist.end_date else "",
        "creators": [_creator_ref(creator) for creator in creators],
        "createdAt": shortlist.created_at.isoformat(),
        "updatedAt": shortlist.updated_at.isoformat(),
        # Legacy fields kept for the older client Admin panel
        "brand_id": str(shortlist.brand.brand_id),
        "brand": shortlist.brand.company_name,
        "creators_count": len(creators),
        "start_date": shortlist.start_date.isoformat() if shortlist.start_date else None,
        "end_date": shortlist.end_date.isoformat() if shortlist.end_date else None,
    }


def serialize_admin_brand(brand, request=None):
    """Map a BrandProfile into the shape the Admin portal's Brand type expects."""
    campaigns_qs = brand.campaigns.all()
    total_campaigns = campaigns_qs.count()
    active_campaigns = campaigns_qs.filter(status=CampaignStatus.ACTIVE).count()
    total_spend = campaigns_qs.aggregate(total=Sum("total_budget"))["total"] or 0
    creators_hired = (
        CampaignApplication.objects.filter(campaign__brand=brand, status=ApplicationStatus.ACCEPTED)
        .values("creator_id")
        .distinct()
        .count()
    )

    logo_url = ""
    if brand.logo:
        logo_url = request.build_absolute_uri(brand.logo.url) if request else brand.logo.url

    address = ", ".join(
        part for part in [brand.headquarters_city, brand.headquarters_state, brand.headquarters_country] if part
    )

    return {
        "id": str(brand.brand_id),
        "name": brand.company_name,
        "logoUrl": logo_url,
        "industry": brand.industry,
        "website": brand.website,
        "email": brand.user.email,
        "phone": brand.user.phone_no or "",
        "address": address,
        "verificationStatus": VERIFICATION_STATUS_LABELS.get(brand.user.verification_status, "Unverified"),
        "accountStatus": _account_status_label(brand.user),
        "totalCampaigns": total_campaigns,
        "activeCampaigns": active_campaigns,
        "creatorsHired": creators_hired,
        "totalSpend": float(total_spend),
        "joinedAt": brand.created_at.isoformat(),
        "description": brand.about_brand,
        "invoices": [],
        # Legacy fields kept for the older client Admin panel (client/src/components/Admin/AdminBrands.tsx)
        "visibility": brand.user.is_profile_visible,
        "verification": brand.user.verification_status,
        "campaigns_count": total_campaigns,
    }


CAMPAIGN_STATUS_LABELS = {
    "DRAFT": "Draft",
    "ACTIVE": "Active",
    "PAUSED": "Paused",
    "COMPLETED": "Completed",
}

CAMPAIGN_STATUS_FROM_LABEL = {label: code for code, label in CAMPAIGN_STATUS_LABELS.items()}


def _parse_deliverables_text(text, end_date=None):
    items = [part.strip() for part in (text or "").split(",") if part.strip()]
    deliverables = []
    for index, item in enumerate(items):
        deliverables.append({
            "id": f"deliv-{index + 1}",
            "title": item,
            "platform": "Instagram",
            "type": "Reel",
            "quantity": 1,
            "completedQuantity": 0,
            "dueDate": end_date.isoformat() if end_date else "",
        })
    return deliverables


def serialize_admin_campaign(campaign, request=None):
    """Map a Campaign into the shape the Admin portal's Campaign type expects."""
    applications = campaign.applications.all()
    creators_selected = applications.filter(status=ApplicationStatus.ACCEPTED).count()
    deliverables = _parse_deliverables_text(campaign.deliverables, campaign.end_date)

    brand_logo = ""
    if campaign.brand.logo:
        brand_logo = request.build_absolute_uri(campaign.brand.logo.url) if request else campaign.brand.logo.url

    return {
        "id": str(campaign.campaign_id),
        "campaignCode": f"CMP-{str(campaign.campaign_id)[:8].upper()}",
        "title": campaign.title,
        "brandId": str(campaign.brand.brand_id),
        "brandName": campaign.brand.company_name,
        "brandLogo": brand_logo,
        "category": campaign.category,
        "description": campaign.brief,
        "objective": campaign.objective,
        "targetAudience": campaign.audience_type,
        "platforms": [SOCIAL_PLATFORM_LABELS.get(p, p) for p in (campaign.platforms or [])],
        "budget": float(campaign.total_budget),
        "creatorsRequired": max(creators_selected, applications.count()),
        "creatorsSelected": creators_selected,
        "applicationsCount": applications.count(),
        "startDate": campaign.start_date.isoformat() if campaign.start_date else "",
        "endDate": campaign.end_date.isoformat() if campaign.end_date else "",
        "status": CAMPAIGN_STATUS_LABELS.get(campaign.status, "Draft"),
        "campaignManager": "",
        "deliverables": deliverables,
        "deliverablesTotal": len(deliverables),
        "deliverablesCompleted": 0,
        "createdAt": campaign.created_at.isoformat(),
        # Legacy fields kept for the older client Admin panel (client/src/lib/authApi.ts AdminCampaignTableItem)
        "brand_id": str(campaign.brand.brand_id),
        "brand": campaign.brand.company_name,
        "applications_received_count": applications.count(),
        "recommended_creators_count": creators_selected,
    }


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


CATEGORY_COLORS = ["#6366F1", "#3B82F6", "#EC4899", "#8B5CF6", "#F59E0B", "#10B981", "#06B6D4", "#14B8A6"]


def _growth_rate(current, previous):
    if not previous:
        return 100.0 if current else 0.0
    return round((current - previous) / previous * 100, 1)


def build_admin_dashboard_stats():
    """Live KPI counters + 30-day growth rates for the Admin dashboard."""
    now = timezone.now()
    thirty_days_ago = now - timedelta(days=30)
    sixty_days_ago = now - timedelta(days=60)

    total_creators = CreatorProfile.objects.count()
    verified_creators = CreatorProfile.objects.filter(user__verification_status=VerificationStatus.VERIFIED).count()
    pending_creator_verification = CreatorProfile.objects.filter(
        user__verification_status=VerificationStatus.PENDING
    ).count()

    total_brands = BrandProfile.objects.count()
    verified_brands = BrandProfile.objects.filter(user__verification_status=VerificationStatus.VERIFIED).count()

    active_campaigns = Campaign.objects.filter(status=CampaignStatus.ACTIVE).count()
    completed_campaigns = Campaign.objects.filter(status=CampaignStatus.COMPLETED).count()

    internal_staff_users = User.objects.filter(role=UserRole.ADMIN).count()

    creators_recent = CreatorProfile.objects.filter(created_at__gte=thirty_days_ago).count()
    creators_prior = CreatorProfile.objects.filter(
        created_at__gte=sixty_days_ago, created_at__lt=thirty_days_ago
    ).count()

    brands_recent = BrandProfile.objects.filter(created_at__gte=thirty_days_ago).count()
    brands_prior = BrandProfile.objects.filter(created_at__gte=sixty_days_ago, created_at__lt=thirty_days_ago).count()

    campaigns_recent = Campaign.objects.filter(created_at__gte=thirty_days_ago).count()
    campaigns_prior = Campaign.objects.filter(created_at__gte=sixty_days_ago, created_at__lt=thirty_days_ago).count()

    spend_recent = Campaign.objects.filter(created_at__gte=thirty_days_ago).aggregate(total=Sum("total_budget"))[
        "total"
    ] or 0
    spend_prior = Campaign.objects.filter(
        created_at__gte=sixty_days_ago, created_at__lt=thirty_days_ago
    ).aggregate(total=Sum("total_budget"))["total"] or 0

    return {
        "totalCreators": total_creators,
        "verifiedCreators": verified_creators,
        "pendingCreatorVerification": pending_creator_verification,
        "totalBrands": total_brands,
        "verifiedBrands": verified_brands,
        "activeCampaigns": active_campaigns,
        "completedCampaigns": completed_campaigns,
        "internalStaffUsers": internal_staff_users,
        "creatorsGrowthRate": _growth_rate(creators_recent, creators_prior),
        "brandsGrowthRate": _growth_rate(brands_recent, brands_prior),
        "campaignsGrowthRate": _growth_rate(campaigns_recent, campaigns_prior),
        "spendGrowthRate": _growth_rate(float(spend_recent), float(spend_prior)),
    }


def build_admin_user_growth(time_range: str = "30d"):
    """Cumulative creators/brands signed up as of each bucket, for the growth chart."""
    now = timezone.now()
    buckets = []
    if time_range == "7d":
        buckets = [((now - timedelta(days=i)).strftime("%a"), now - timedelta(days=i)) for i in range(6, -1, -1)]
    elif time_range == "90d":
        buckets = [((now - relativedelta(months=i)).strftime("%b"), now - relativedelta(months=i)) for i in range(2, -1, -1)]
    elif time_range == "1y":
        buckets = [((now - relativedelta(months=i)).strftime("%b"), now - relativedelta(months=i)) for i in range(7, -1, -1)]
    else:  # 30d
        buckets = [(f"Week {4 - i}", now - timedelta(weeks=i)) for i in range(3, -1, -1)]

    return [
        {
            "name": label,
            "creators": CreatorProfile.objects.filter(created_at__lte=bucket_end).count(),
            "brands": BrandProfile.objects.filter(created_at__lte=bucket_end).count(),
        }
        for label, bucket_end in buckets
    ]


def build_admin_campaign_overview():
    """Campaigns created per month, broken down by status, for the last 6 months."""
    now = timezone.now()
    data = []
    for i in range(5, -1, -1):
        month_date = now - relativedelta(months=i)
        month_start = month_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        next_month = month_start + relativedelta(months=1)
        qs = Campaign.objects.filter(created_at__gte=month_start, created_at__lt=next_month)
        data.append({
            "month": month_start.strftime("%b"),
            "active": qs.filter(status=CampaignStatus.ACTIVE).count(),
            "completed": qs.filter(status=CampaignStatus.COMPLETED).count(),
            "draft": qs.filter(status=CampaignStatus.DRAFT).count(),
            "paused": qs.filter(status=CampaignStatus.PAUSED).count(),
        })
    return data


def build_admin_category_distribution():
    """Creator counts grouped by category, for the donut chart."""
    rows = (
        CreatorProfile.objects.exclude(category="")
        .values("category")
        .annotate(value=Count("creator_id"))
        .order_by("-value")
    )
    return [
        {"name": row["category"], "value": row["value"], "color": CATEGORY_COLORS[i % len(CATEGORY_COLORS)]}
        for i, row in enumerate(rows)
    ]


def build_admin_dashboard_payload(time_range: str = "30d"):
    return {
        "stats": build_admin_dashboard_stats(),
        "growth": build_admin_user_growth(time_range),
        "campaignOverview": build_admin_campaign_overview(),
        "categoryDistribution": build_admin_category_distribution(),
    }
