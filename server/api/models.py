import uuid
import random
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from django.contrib.postgres.fields import ArrayField
from django.utils.text import slugify

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

class User(AbstractUser):

    ROLE_CHOICES = (
        ("CREATOR", "Creator"),
        ("BRAND", "Brand"),
    )

    username = models.CharField(
        max_length=150,
        unique=True
    )
    email = models.EmailField(unique=True, null=True, blank=True)
    phone_number = models.CharField(
        max_length=15,
        unique=True,
        null=True,
        blank=True
    )
    first_name = models.CharField(max_length=30, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    brand_name = models.CharField(max_length=255, blank=True)
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES
    )
    is_phone_verified = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(default=False)

    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = []

    def __str__(self):
        return f"{self.username} - {self.role}"
    
class OTPVerification(models.Model):

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_verified = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.phone_number} - {self.otp}"

class Brand(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_by = models.ForeignKey(User,on_delete=models.SET_NULL,null=True,related_name="brands_created")    
    website = models.URLField(blank=True)

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

    brand = models.OneToOneField(Brand, on_delete=models.CASCADE, related_name="onboarding")
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


# =========================================================
# CREATOR CATEGORY
# =========================================================

class CreatorCategory(models.Model):

    name = models.CharField(max_length=100)

    slug = models.SlugField(unique=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


# =========================================================
# LANGUAGE
# =========================================================

class Language(models.Model):

    name = models.CharField(max_length=100)

    code = models.CharField(max_length=10)

    def __str__(self):
        return self.name


# =========================================================
# SOCIAL MEDIA PLATFORM
# =========================================================

class SocialPlatform(models.Model):

    PLATFORM_CHOICES = (
        ("INSTAGRAM", "Instagram"),
        ("YOUTUBE", "YouTube"),
        ("SNAPCHAT", "Snapchat"),
        ("X", "X"),
        ("FACEBOOK", "Facebook"),
        ("LINKEDIN", "LinkedIn"),
    )

    name = models.CharField(max_length=50, choices=PLATFORM_CHOICES)

    def __str__(self):
        return self.name


# =========================================================
# CREATOR PROFILE
# =========================================================

class CreatorProfile(models.Model):

    GENDER_CHOICES = (
        ("MALE", "Male"),
        ("FEMALE", "Female"),
        ("OTHER", "Other"),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE)

    full_name = models.CharField(max_length=255)

    email = models.EmailField()

    profile_image = models.ImageField(upload_to="creator/profile/", null=True, blank=True)

    date_of_birth = models.DateField(null=True, blank=True)

    age = models.PositiveIntegerField(null=True, blank=True)

    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)

    bio = models.TextField()

    category = models.ForeignKey(
        CreatorCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    languages = models.ManyToManyField(Language, blank=True)

    content_type = models.CharField(max_length=255)

    average_views = models.PositiveBigIntegerField(default=0)

    total_likes = models.PositiveBigIntegerField(default=0)

    total_followers = models.PositiveBigIntegerField(default=0)

    total_posts = models.PositiveBigIntegerField(default=0)

    rating = models.FloatField(default=0)

    total_reviews = models.PositiveIntegerField(default=0)

    total_brand_collaborations = models.PositiveIntegerField(default=0)

    is_profile_completed = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.full_name


# =========================================================
# CREATOR SOCIAL MEDIA
# =========================================================

class CreatorSocialMedia(models.Model):

    creator = models.ForeignKey(
        CreatorProfile,
        on_delete=models.CASCADE,
        related_name="social_accounts"
    )

    platform = models.ForeignKey(
        SocialPlatform,
        on_delete=models.CASCADE
    )

    username = models.CharField(max_length=255)

    profile_url = models.URLField()

    followers = models.PositiveBigIntegerField(default=0)

    following = models.PositiveBigIntegerField(default=0)

    posts = models.PositiveBigIntegerField(default=0)

    average_views = models.PositiveBigIntegerField(default=0)

    engagement_rate = models.FloatField(default=0)

    fetched_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.creator.full_name} - {self.platform.name}"


# =========================================================
# CREATOR REVIEW
# =========================================================

class CreatorReview(models.Model):

    creator = models.ForeignKey(
        CreatorProfile,
        on_delete=models.CASCADE,
        related_name="reviews"
    )

    brand = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )

    rating = models.IntegerField()

    review = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.creator.full_name} - {self.rating}"


# =========================================================
# BRAND PROFILE
# =========================================================

class LegacyBrandProfile(models.Model):

    COMPANY_SIZE_CHOICES = (
        ("JUST_ME", "Just Me"),
        ("2_10", "2-10"),
        ("11_50", "11-50"),
        ("51_200", "51-200"),
        ("201_500", "201-500"),
        ("500_PLUS", "500+"),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE)

    company_name = models.CharField(max_length=255)

    company_logo = models.ImageField(upload_to="brand/logo/", null=True, blank=True)

    website = models.URLField(null=True, blank=True)

    description = models.TextField()

    company_size = models.CharField(
        max_length=20,
        choices=COMPANY_SIZE_CHOICES
    )

    industry = models.CharField(max_length=255)

    is_verified = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.company_name


# =========================================================
# BRAND COLLABORATION HISTORY
# =========================================================

class BrandCollaboration(models.Model):

    STATUS_CHOICES = (
        ("PENDING", "Pending"),
        ("ACTIVE", "Active"),
        ("COMPLETED", "Completed"),
        ("REJECTED", "Rejected"),
    )

    brand = models.ForeignKey(
        LegacyBrandProfile,
        on_delete=models.CASCADE
    )

    creator = models.ForeignKey(
        CreatorProfile,
        on_delete=models.CASCADE
    )

    title = models.CharField(max_length=255)

    description = models.TextField()

    budget = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="PENDING"
    )

    started_at = models.DateTimeField(null=True, blank=True)

    completed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class Creator(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="creator")
    display_name = models.CharField(max_length=120)
    bio = models.TextField(blank=True)
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