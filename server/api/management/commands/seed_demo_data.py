from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from api.models import (
    ApplicationStatus,
    BrandProfile,
    BrandShortlist,
    Campaign,
    CampaignApplication,
    CreatorProfile,
    CreatorSavedCampaign,
    CreatorSocialAccount,
    OtpChannel,
    OtpVerification,
    ShortlistStatus,
    SocialPlatform,
    UserRole,
    VerificationStatus,
)


class Command(BaseCommand):
    help = "Seed local demo data for the current API schema."

    creator_categories = [
        "Fashion",
        "Beauty",
        "Food",
        "Travel",
        "Fitness",
        "Tech",
        "Gaming",
        "Finance",
        "Education",
        "Lifestyle",
        "Health",
        "Music",
        "Parenting",
        "Sports",
        "Comedy",
    ]

    brand_industries = [
        "Apparel",
        "Cosmetics",
        "Restaurant",
        "Travel",
        "Wellness",
        "SaaS",
        "Gaming",
        "Fintech",
        "Edtech",
        "Home",
        "Healthcare",
        "MusicTech",
        "Family",
        "Sportswear",
        "Entertainment",
    ]

    def add_arguments(self, parser):
        parser.add_argument(
            "--count",
            type=int,
            default=15,
            help="Number of records to create per main API model.",
        )
        parser.add_argument(
            "--password",
            default="DemoPass123!",
            help="Password to set for seeded demo users.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        count = options["count"]
        password = options["password"]
        now = timezone.now()
        today = timezone.localdate()
        User = get_user_model()

        creators = []
        brands = []
        campaigns = []

        for index in range(1, count + 1):
            category = self.creator_categories[(index - 1) % len(self.creator_categories)]
            user = self.upsert_user(
                User,
                username=f"demo_creator_{index:02d}",
                email=f"demo.creator{index:02d}@collune.test",
                phone_no=f"+1555100{index:03d}",
                name=f"Demo Creator {index:02d}",
                role=UserRole.CREATOR,
                password=password,
            )
            creator, _ = CreatorProfile.objects.update_or_create(
                user=user,
                defaults={
                    "display_name": f"{category} Creator {index:02d}",
                    "category": category,
                    "location": "United States",
                    "languages": ["English", "Spanish"] if index % 2 == 0 else ["English"],
                    "collaboration_preferences": ["Paid campaigns", "Product reviews"],
                    "bio": f"Demo creator focused on {category.lower()} content.",
                    "about": f"Creates practical {category.lower()} stories for engaged audiences.",
                    "gender": "Not specified",
                    "profile_completion": min(100, 80 + index),
                    "work_with": ["Brands", "Agencies"],
                },
            )
            CreatorSocialAccount.objects.update_or_create(
                creator=creator,
                platform=SocialPlatform.INSTAGRAM,
                handle=f"demo_creator_{index:02d}",
                defaults={
                    "social_id": f"ig_demo_{index:02d}",
                    "username": f"demo_creator_{index:02d}",
                    "url": f"https://instagram.com/demo_creator_{index:02d}",
                    "followers": 5000 + index * 1750,
                    "media_count": 80 + index * 9,
                    "view_count": 25000 + index * 6500,
                    "engagement_rate": round(2.8 + index * 0.17, 2),
                    "video_count": 25 + index,
                    "videos": [
                        {"title": f"Demo video {index}-1", "views": 1200 + index * 50},
                        {"title": f"Demo video {index}-2", "views": 1600 + index * 70},
                    ],
                    "analytics": {"reach": 10000 + index * 800, "saves": 150 + index * 10},
                    "provider_data": {"source": "demo_seed", "synced": True},
                    "is_connected": True,
                    "last_synced_at": now,
                },
            )
            creators.append(creator)

        for index in range(1, count + 1):
            industry = self.brand_industries[(index - 1) % len(self.brand_industries)]
            user = self.upsert_user(
                User,
                username=f"demo_brand_{index:02d}",
                email=f"demo.brand{index:02d}@collune.test",
                phone_no=f"+1555200{index:03d}",
                name=f"Demo Brand {index:02d}",
                role=UserRole.BRAND,
                password=password,
            )
            brand, _ = BrandProfile.objects.update_or_create(
                user=user,
                defaults={
                    "company_name": f"{industry} Brand {index:02d}",
                    "industry": industry,
                    "website": f"https://brand{index:02d}.example.com",
                    "company_size": "11-50",
                    "linkedin_url": f"https://linkedin.com/company/demo-brand-{index:02d}",
                },
            )
            brands.append(brand)

        for index in range(1, count + 1):
            brand = brands[index - 1]
            category = self.creator_categories[(index - 1) % len(self.creator_categories)]
            campaign, _ = Campaign.objects.update_or_create(
                brand=brand,
                internal_reference_name=f"demo-campaign-{index:02d}",
                defaults={
                    "title": f"{category} Creator Launch {index:02d}",
                    "brief": f"Partner with creators to promote a {category.lower()} launch.",
                    "objective": f"Drive awareness and trial for a {category.lower()} campaign.",
                    "deliverables": "1 reel, 3 stories, and 30-day usage rights.",
                    "brand_requirements": f"Looking for {category.lower()} creators in the United States.",
                    "creative_direction": "Authentic product-led storytelling with a clear CTA.",
                    "tone_of_communication": "Friendly, clear, and aspirational.",
                    "content_references": "Creator-led product demo references.",
                    "platforms": ["INSTAGRAM", "YOUTUBE"] if index % 2 == 0 else ["INSTAGRAM"],
                    "category": category,
                    "audience_type": "Gen Z and Millennials",
                    "location": "United States",
                    "minimum_followers": 3000 + index * 1000,
                    "language_preference": "English",
                    "content_style": "Short-form video",
                    "additional_preferences": "Prefer creators with strong engagement.",
                    "total_budget": Decimal("1500.00") + Decimal(index * 250),
                    "budget_range": "$1,000 - $5,000",
                    "compensation_type": "Paid",
                    "deliverable_pricing": {"reel": "600", "story": "150"},
                    "start_date": today + timedelta(days=index),
                    "end_date": today + timedelta(days=index + 21),
                    "deadline": today + timedelta(days=index + 10),
                    "created_at": now - timedelta(days=count - index),
                },
            )
            campaigns.append(campaign)

            shortlist, _ = BrandShortlist.objects.update_or_create(
                brand=brand,
                title=f"{category} Creator Shortlist {index:02d}",
                defaults={
                    "status": ShortlistStatus.SUBMITTED if index % 2 == 0 else ShortlistStatus.DRAFT,
                    "purpose": f"Find creators for {campaign.title}.",
                    "notes": "Seeded shortlist for dashboard and list testing.",
                    "platforms": campaign.platforms,
                    "categories": category,
                    "audience": "Gen Z and Millennials",
                    "budget_range": campaign.budget_range,
                    "start_date": campaign.start_date,
                    "end_date": campaign.end_date,
                },
            )
            start = (index - 1) % len(creators)
            shortlist.creators.set(
                [
                    creators[start],
                    creators[(start + 1) % len(creators)],
                    creators[(start + 2) % len(creators)],
                ]
            )

        for index in range(1, count + 1):
            creator = creators[index - 1]
            campaign = campaigns[index - 1]
            CampaignApplication.objects.update_or_create(
                campaign=campaign,
                creator=creator,
                defaults={
                    "pitch": f"I can create a strong campaign concept for {campaign.title}.",
                    "quoted_rate": Decimal("750.00") + Decimal(index * 55),
                    "status": self.application_status_for(index),
                },
            )
            CreatorSavedCampaign.objects.update_or_create(
                campaign=campaigns[(index % len(campaigns))],
                creator=creator,
                defaults={"created_at": now - timedelta(hours=index)},
            )

        for index in range(1, count + 1):
            target = f"demo.otp{index:02d}@collune.test"
            OtpVerification.objects.update_or_create(
                target=target,
                purpose="creator_registration",
                defaults={
                    "channel": OtpChannel.EMAIL if index % 2 else OtpChannel.PHONE,
                    "code": f"{100000 + index}",
                    "is_verified": index % 3 == 0,
                    "attempts": index % 4,
                    "expires_at": now + timedelta(minutes=10 + index),
                    "verified_at": now if index % 3 == 0 else None,
                },
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded demo data: {count} creators, {count} brands, {count} campaigns, "
                f"{count} shortlists, {count} applications, {count} saved campaigns, "
                f"{count} social accounts, and {count} OTPs."
            )
        )

    def application_status_for(self, index):
        statuses = [
            ApplicationStatus.APPLIED,
            ApplicationStatus.ACCEPTED,
            ApplicationStatus.REJECTED,
        ]
        return statuses[(index - 1) % len(statuses)]

    def upsert_user(self, User, *, username, email, phone_no, name, role, password):
        user, _ = User.objects.update_or_create(
            username=username,
            defaults={
                "email": email,
                "phone_no": phone_no,
                "name": name,
                "role": role,
                "verification_status": VerificationStatus.VERIFIED,
                "is_profile_visible": True,
            },
        )
        user.set_password(password)
        user.save(update_fields=["password"])
        return user
