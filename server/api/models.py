import uuid
import random
from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone
from django.contrib.postgres.fields import ArrayField


class Category(models.Model):
    name = models.CharField(max_length=64, unique=True)
    slug = models.SlugField(max_length=80, unique=True)


class Tag(models.Model):
    name = models.CharField(max_length=64, unique=True)
    slug = models.SlugField(max_length=80, unique=True)

class SocialMediaPlatform(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=80, unique=True)
    link = models.URLField(blank=True)

class Brand(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_by = models.ForeignKey(User,on_delete=models.SET_NULL,null=True,related_name="brands_created")    
    brand_name = models.CharField(max_length=255)
    website = models.URLField(blank=True)
    contact_phone = models.CharField(max_length=20, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.brand_name

class Address(models.Model):
    brand = models.OneToOneField(Brand or None, on_delete=models.SET_NULL, related_name="address", null=True, blank=True)

    street = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100)


    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.brand.brand_name}, {self.city}, {self.country}"

class BrandMember(models.Model):
    STATUS = (
        ("Pending", "Pending"),
        ("Active", "Active"),
        ("Inactive", "Inactive")
    )

    brand = models.ForeignKey(Brand, on_delete=models.CASCADE, related_name="member_links")
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="brand_memberships")
    role = models.CharField(max_length=64, default="MEMBER")
    status = models.CharField(max_length=20, choices=STATUS, default="Pending", db_index=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.brand.brand_name}"

class BrandOnboarding(models.Model):
    COMPANY_SIZE_CHOICES = (
        ("JUST_ME", "Just Me"),
        ("2-10", "2-10"),
        ("11-50", "11-50"),
        ("51-200", "51-200"),
        ("201-500", "201-500"),
        ("500+", "500+"),
    )

    COMPANY_BUDGET = (
        ("<10K", "<$10K"),
        ("10K-50K", "$10K-$50K"),
        ("50K-200K", "$50K-$200K"),
        ("200K-500K", "$200K-$500K"),
        ("500K+", ">$500K"),
    )

    SOCIAL_MEDIA = (
        ("instagram", "Instagram"),
        ("facebook", "Facebook"),
        ("youtube", "YouTube"),
        ("linkedin", "LinkedIn"),
        ("twitter", "Twitter/X"),
    )

    COMPANY_TYPE = (
        ("RETAIL", "Retail"),
        ("TECH", "Tech"),
        ("FOOD_BEVERAGE", "Food & Beverage"),
        ("HEALTH_BEAUTY", "Health & Beauty"),
        ("TRAVEL", "Travel"),
        ("OTHER", "Other"),
    )

    DISCOVER_OPPORTUNITIES = (
        ("DISCOVER_OPPORTUNITIES", "Discover new opportunities"),
        ("MANAGE_CAMPAIGNS", "Manage influencer campaigns"),
        ("ANALYTICS", "Access analytics and insights"),
        ("OTHER", "Other"),
    )

    brand = models.OneToOneField(Brand, on_delete=models.CASCADE, related_name="profile")
    company_size = models.CharField(max_length=20, choices=COMPANY_SIZE_CHOICES)
    annual_marketing_budget = models.CharField(max_length=20, choices=COMPANY_BUDGET)
    social_media_content_focus = ArrayField(models.CharField(max_length=20, choices=SOCIAL_MEDIA),default=list,blank=True)
    company_type = models.CharField(max_length=20, choices=COMPANY_TYPE)
    what_brings_you_to_collune = models.CharField(max_length=200, choices=DISCOVER_OPPORTUNITIES)
    is_onboarding_completed = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.brand.brand_name} Profile"


class BrandProfile(models.Model):
    brand = models.OneToOneField(Brand, on_delete=models.CASCADE, related_name="profile")
    company_discription = models.TextField(blank=True)
    company_category = models.ManyToManyField(Category, blank=True, related_name="brand_profiles")
    social_media_links = models.ManyToManyField(SocialMediaPlatform, blank=True, related_name="brand_profiles")

    logo = models.ImageField(upload_to="brand_logos/", blank=True, null=True)
    cover_photo = models.ImageField(upload_to="brand_covers/", blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.brand.brand_name} Profile"

class Role(models.Model):
    code = models.CharField(max_length=32, unique=True)
    name = models.CharField(max_length=64)

    def __str__(self):
        return self.code





class Creator(models.Model):
    VERIFICATION_STATUS = (
        ("PENDING", "Pending"),
        ("VERIFIED", "Verified"),
        ("REJECTED", "Rejected"),
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="creator")
    display_name = models.CharField(max_length=120)
    bio = models.TextField(blank=True)
    verification_status = models.CharField(max_length=16, choices=VERIFICATION_STATUS, default="PENDING", db_index=True)
    availability_status = models.CharField(max_length=16, default="AVAILABLE", db_index=True)
    authenticity_score = models.FloatField(default=0)
    categories = models.ManyToManyField(Category, blank=True, related_name="creators")
    tags = models.ManyToManyField(Tag, blank=True, related_name="creators")


class CreatorPlatform(models.Model):
    PLATFORM = (
        ("instagram", "Instagram"),
        ("facebook", "Facebook"),
        ("youtube", "YouTube"),
        ("linkedin", "LinkedIn"),
        ("twitter", "Twitter/X"),
    )
    creator = models.ForeignKey(Creator, on_delete=models.CASCADE, related_name="platforms")
    platform = models.CharField(max_length=20, choices=PLATFORM, db_index=True)
    handle = models.CharField(max_length=150)
    followers = models.PositiveIntegerField(default=0)
    engagement_rate = models.FloatField(default=0)
    audience_quality_score = models.FloatField(default=0)

    class Meta:
        unique_together = ("creator", "platform", "handle")


class Campaign(models.Model):
    STATUS = (
        ("DRAFT", "Draft"),
        ("SUBMITTED", "Submitted"),
        ("UNDER_REVIEW", "Under Review"),
        ("ACTIVE", "Active"),
        ("COMPLETED", "Completed"),
        ("CANCELLED", "Cancelled"),
    )
    brand = models.ForeignKey(Brand, on_delete=models.CASCADE, related_name="campaigns")
    name = models.CharField(max_length=255)
    goal = models.TextField(blank=True)
    budget = models.DecimalField(max_digits=14, decimal_places=2)
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=16, choices=STATUS, default="DRAFT", db_index=True)
    categories = models.ManyToManyField(Category, blank=True, related_name="campaigns")
    tags = models.ManyToManyField(Tag, blank=True, related_name="campaigns")


class CampaignBrief(models.Model):
    campaign = models.OneToOneField(Campaign, on_delete=models.CASCADE, related_name="brief")
    deliverables = models.JSONField(default=list)
    audience_demographics = models.JSONField(default=dict)
    content_guidelines = models.TextField(blank=True)
    admin_notes = models.TextField(blank=True)


class CampaignCreator(models.Model):
    STATUS = (
        ("INVITED", "Invited"),
        ("ACCEPTED", "Accepted"),
        ("REJECTED", "Rejected"),
        ("IN_PROGRESS", "In Progress"),
        ("SUBMITTED", "Submitted"),
        ("APPROVED", "Approved"),
        ("REVISION_REQUESTED", "Revision Requested"),
    )
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name="campaign_creators")
    creator = models.ForeignKey(Creator, on_delete=models.CASCADE, related_name="campaign_links")
    matching_score = models.FloatField(default=0, db_index=True)
    status = models.CharField(max_length=24, choices=STATUS, default="INVITED", db_index=True)

    class Meta:
        unique_together = ("campaign", "creator")


class Deliverable(models.Model):
    campaign_creator = models.ForeignKey(CampaignCreator, on_delete=models.CASCADE, related_name="deliverables")
    title = models.CharField(max_length=255)
    file_url = models.URLField(blank=True)
    submission_note = models.TextField(blank=True)
    admin_review_status = models.CharField(max_length=20, default="PENDING", db_index=True)
    brand_review_status = models.CharField(max_length=20, default="PENDING", db_index=True)


class AnalyticsSnapshot(models.Model):
    creator_platform = models.ForeignKey(CreatorPlatform, on_delete=models.CASCADE, related_name="snapshots")
    snapshot_date = models.DateField(db_index=True)
    followers = models.PositiveIntegerField(default=0)
    engagement = models.FloatField(default=0)
    reach = models.PositiveIntegerField(default=0)
    impressions = models.PositiveIntegerField(default=0)
    saves = models.PositiveIntegerField(default=0)
    shares = models.PositiveIntegerField(default=0)
    ctr = models.FloatField(default=0)
    sentiment_score = models.FloatField(default=0)
    fake_follower_score = models.FloatField(default=0)

    class Meta:
        unique_together = ("creator_platform", "snapshot_date")


class Report(models.Model):
    REPORT_TYPE = (
        ("BRAND", "Brand"),
        ("CREATOR", "Creator"),
        ("ADMIN", "Admin"),
    )
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name="reports", null=True, blank=True)
    report_type = models.CharField(max_length=16, choices=REPORT_TYPE, db_index=True)
    payload = models.JSONField(default=dict)


class Invoice(models.Model):
    brand = models.ForeignKey(Brand, on_delete=models.CASCADE, related_name="invoices")
    campaign = models.ForeignKey(Campaign, on_delete=models.SET_NULL, null=True, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    due_date = models.DateField()
    status = models.CharField(max_length=20, default="PENDING", db_index=True)


class Payout(models.Model):
    creator = models.ForeignKey(Creator, on_delete=models.CASCADE, related_name="payouts")
    campaign_creator = models.ForeignKey(CampaignCreator, on_delete=models.SET_NULL, null=True, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, default="PENDING", db_index=True)
    paid_at = models.DateTimeField(null=True, blank=True)


class ChatRoom(models.Model):
    ROOM_TYPE = (
        ("ADMIN_BRAND", "Admin-Brand"),
        ("ADMIN_CREATOR", "Admin-Creator"),
        ("BRAND_CREATOR", "Brand-Creator"),
    )
    room_type = models.CharField(max_length=20, choices=ROOM_TYPE, db_index=True)
    campaign = models.ForeignKey(Campaign, on_delete=models.SET_NULL, null=True, blank=True)
    participants = models.ManyToManyField(User, related_name="chat_rooms")


class ChatMessage(models.Model):
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    content = models.TextField()
    is_read = models.BooleanField(default=False)


class Notification(models.Model):
    NOTIFICATION_TYPE = (
        ("IN_APP", "In App"),
        ("EMAIL", "Email"),
        ("SYSTEM", "System"),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=16, choices=NOTIFICATION_TYPE, default="IN_APP")
    is_read = models.BooleanField(default=False, db_index=True)


class AIInteraction(models.Model):
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    prompt = models.TextField()
    response = models.TextField(blank=True)
    model_name = models.CharField(max_length=64, default="internal")
    tokens_used = models.PositiveIntegerField(default=0)
