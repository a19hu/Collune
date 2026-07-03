from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from api.models import (
    BrandProfile,
    BrandShortlist,
    Campaign,
    CreatorProfile,
    CreatorSocialAccount,
    ShortlistStatus,
    SocialPlatform,
    UserRole,
    VerificationStatus,
)


class Command(BaseCommand):
    help = "Seed 10 demo creators, brands, campaigns, and shortlists."

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
    ]

    def add_arguments(self, parser):
        parser.add_argument(
            "--password",
            default="DemoPass123!",
            help="Password to set for seeded demo users.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        password = options["password"]
        User = get_user_model()
        creators = []
        brands = []

        for index, category in enumerate(self.creator_categories, start=1):
            user = self.upsert_user(
                User,
                username=f"demo_creator_{index:02d}",
                email=f"demo.creator{index:02d}@collune.test",
                phone_no=f"+15550010{index:02d}",
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
                    "profile_completion": 100,
                },
            )
            CreatorSocialAccount.objects.update_or_create(
                creator=creator,
                platform=SocialPlatform.INSTAGRAM,
                handle=f"demo_creator_{index:02d}",
                defaults={
                    "username": f"demo_creator_{index:02d}",
                    "url": f"https://instagram.com/demo_creator_{index:02d}",
                    "followers": 5000 + index * 1750,
                    "media_count": 80 + index * 9,
                    "view_count": 25000 + index * 6500,
                    "engagement_rate": round(2.8 + index * 0.17, 2),
                    "is_connected": True,
                    "last_synced_at": timezone.now(),
                },
            )
            creators.append(creator)

        for index, industry in enumerate(self.brand_industries, start=1):
            user = self.upsert_user(
                User,
                username=f"demo_brand_{index:02d}",
                email=f"demo.brand{index:02d}@collune.test",
                phone_no=f"+15550020{index:02d}",
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

        today = timezone.localdate()
        for index, brand in enumerate(brands, start=1):
            category = self.creator_categories[index - 1]
            campaign, _ = Campaign.objects.update_or_create(
                brand=brand,
                internal_reference_name=f"demo-campaign-{index:02d}",
                defaults={
                    "title": f"{category} Creator Launch {index:02d}",
                    "brief": f"Partner with creators to promote a {category.lower()} launch.",
                    "objective": f"Drive awareness and trial for a {category.lower()} campaign.",
                    "deliverables": "1 reel, 3 stories, and usage rights for 30 days.",
                    "brand_requirements": f"Looking for {category.lower()} creators in the United States.",
                    "creative_direction": "Authentic product-led storytelling with clear call to action.",
                    "tone_of_communication": "Friendly, clear, and aspirational.",
                    "content_references": "Use brand examples and creator-led product demos.",
                    "platforms": ["INSTAGRAM", "YOUTUBE"] if index % 2 == 0 else ["INSTAGRAM"],
                    "category": category,
                    "audience_type": "Gen Z and Millennials",
                    "location": "United States",
                    "minimum_followers": 3000 + index * 1000,
                    "language_preference": "English",
                    "content_style": "Short-form video",
                    "additional_preferences": "Prefer creators with strong engagement.",
                    "total_budget": 1500 + index * 250,
                    "budget_range": "$1,000 - $5,000",
                    "compensation_type": "Paid",
                    "deliverable_pricing": {"reel": "600", "story": "150"},
                    "start_date": today + timedelta(days=index),
                    "end_date": today + timedelta(days=index + 21),
                    "deadline": today + timedelta(days=index + 10),
                    "cover_image": f"https://picsum.photos/seed/collune-campaign-{index:02d}/900/520",
                    "created_at": timezone.now() - timedelta(days=10 - index),
                },
            )

            shortlist, _ = BrandShortlist.objects.update_or_create(
                brand=brand,
                title=f"{category} Creator Shortlist {index:02d}",
                defaults={
                    "status": ShortlistStatus.SUBMITTED,
                    "purpose": f"Find creators for {campaign.title}.",
                    "notes": "Seeded shortlist for dashboard and list testing.",
                    "platforms": campaign.platforms,
                    "categories": category,
                    "audience": "Gen Z and Millennials",
                    "budget_range": campaign.budget_range,
                    "timeline": "Launch within 30 days",
                },
            )
            start = (index - 1) % len(creators)
            shortlist.creators.set([
                creators[start],
                creators[(start + 1) % len(creators)],
                creators[(start + 2) % len(creators)],
            ])

        self.stdout.write(self.style.SUCCESS("Seeded 10 creators, 10 brands, 10 campaigns, and 10 shortlists."))

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
