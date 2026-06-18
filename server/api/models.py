import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class UserRole(models.TextChoices):
    ADMIN = "ADMIN", "Admin"
    BRAND = "BRAND", "Brand"
    CREATOR = "CREATOR", "Creator"


class VerificationStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    PENDING = "PENDING", "Pending review"
    VERIFIED = "VERIFIED", "Verified"
    REJECTED = "REJECTED", "Rejected"


class CampaignStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    ACTIVE = "ACTIVE", "Active"
    REVIEWING = "REVIEWING", "Reviewing"
    PAUSED = "PAUSED", "Paused"
    COMPLETED = "COMPLETED", "Completed"


class ApplicationStatus(models.TextChoices):
    APPLIED = "APPLIED", "Applied"
    SHORTLISTED = "SHORTLISTED", "Shortlisted"
    ACCEPTED = "ACCEPTED", "Accepted"
    REJECTED = "REJECTED", "Rejected"


class SocialPlatform(models.TextChoices):
    INSTAGRAM = "INSTAGRAM", "Instagram"
    YOUTUBE = "YOUTUBE", "YouTube"
    LINKEDIN = "LINKEDIN", "LinkedIn"
    X = "X", "X"
    FACEBOOK = "FACEBOOK", "Facebook"
    TIKTOK = "TIKTOK", "TikTok"
    SNAPCHAT = "SNAPCHAT", "Snapchat"


class OtpChannel(models.TextChoices):
    EMAIL = "EMAIL", "Email"
    PHONE = "PHONE", "Phone"


class User(AbstractUser):
    user_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, db_column="id")
    name = models.CharField(max_length=255, blank=True, default="")
    email = models.EmailField(unique=True)
    phone_no = models.CharField(max_length=20, unique=True, null=True, blank=True)
    role = models.CharField(max_length=32, choices=UserRole.choices, default=UserRole.CREATOR)
    status = models.BooleanField(default=True)
    last_login_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)

    @property
    def profile_name(self):
        return self.name or self.get_full_name() or self.username

    def __str__(self):
        return self.profile_name


class OtpVerification(models.Model):
    otp_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    channel = models.CharField(max_length=16, choices=OtpChannel.choices)
    target = models.CharField(max_length=255, db_index=True)
    code = models.CharField(max_length=6)
    purpose = models.CharField(max_length=64, default="creator_registration")
    is_verified = models.BooleanField(default=False)
    attempts = models.PositiveSmallIntegerField(default=0)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(default=timezone.now)
    verified_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.channel} OTP for {self.target}"


class BrandProfile(models.Model):
    brand_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="brand_profile")
    company_name = models.CharField(max_length=255)
    industry = models.CharField(max_length=120, blank=True, default="")
    website = models.URLField(blank=True, default="")
    company_size = models.CharField(max_length=64, blank=True, default="")
    linkedin_url = models.URLField(blank=True, default="")
    logo = models.ImageField(upload_to="brands/logos/", blank=True, null=True)
    verification_status = models.CharField(
        max_length=24,
        choices=VerificationStatus.choices,
        default=VerificationStatus.PENDING,
    )
    profile_completion = models.PositiveSmallIntegerField(default=90)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.company_name


class CreatorProfile(models.Model):
    creator_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="creator_profile")
    display_name = models.CharField(max_length=255)
    category = models.CharField(max_length=120, blank=True, default="")
    location = models.CharField(max_length=160, blank=True, default="")
    languages = models.JSONField(default=list, blank=True)
    collaboration_preferences = models.JSONField(default=list, blank=True)
    preferred_response_time = models.CharField(max_length=80, blank=True, default="")
    open_to_travel = models.BooleanField(default=False)
    bio = models.TextField(blank=True, default="")
    portfolio_url = models.URLField(blank=True, default="")
    profile_image = models.ImageField(upload_to="creators/profiles/", blank=True, null=True)
    audience_size = models.PositiveIntegerField(default=0)
    rate_min = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    rate_max = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    verification_status = models.CharField(
        max_length=24,
        choices=VerificationStatus.choices,
        default=VerificationStatus.PENDING,
    )
    profile_completion = models.PositiveSmallIntegerField(default=85)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.display_name


class CreatorSocialAccount(models.Model):
    account_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    creator = models.ForeignKey(CreatorProfile, on_delete=models.CASCADE, related_name="social_accounts")
    platform = models.CharField(max_length=24, choices=SocialPlatform.choices)
    handle = models.CharField(max_length=120)
    is_connected = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ("creator", "platform", "handle")

    def __str__(self):
        return f"{self.creator.display_name} - {self.platform}"


class Campaign(models.Model):
    campaign_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    brand = models.ForeignKey(BrandProfile, on_delete=models.CASCADE, related_name="campaigns")
    title = models.CharField(max_length=255)
    internal_reference_name = models.CharField(max_length=255, blank=True, default="")
    brief = models.TextField()
    objective = models.TextField(blank=True, default="")
    deliverables = models.TextField(blank=True, default="")
    brand_requirements = models.TextField(blank=True, default="")
    creative_direction = models.TextField(blank=True, default="")
    tone_of_communication = models.TextField(blank=True, default="")
    brand_guidelines = models.FileField(upload_to="campaigns/guidelines/", blank=True, null=True)
    content_references = models.TextField(blank=True, default="")
    platforms = models.JSONField(blank=True, default=list)
    category = models.CharField(max_length=120, blank=True, default="")
    audience_type = models.CharField(max_length=120, blank=True, default="")
    location = models.CharField(max_length=160, blank=True, default="")
    minimum_followers = models.PositiveIntegerField(default=0)
    language_preference = models.CharField(max_length=80, blank=True, default="")
    content_style = models.CharField(max_length=120, blank=True, default="")
    additional_preferences = models.TextField(blank=True, default="")
    total_budget = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    budget_range = models.CharField(max_length=80, blank=True, default="")
    compensation_type = models.CharField(max_length=80, blank=True, default="")
    deliverable_pricing = models.JSONField(blank=True, default=dict)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    deadline = models.DateField(null=True, blank=True)
    cover_image = models.URLField(blank=True, default="")
    status = models.CharField(max_length=24, choices=CampaignStatus.choices, default=CampaignStatus.DRAFT)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return self.title


class CampaignApplication(models.Model):
    application_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name="applications")
    creator = models.ForeignKey(CreatorProfile, on_delete=models.CASCADE, related_name="applications")
    pitch = models.TextField(blank=True, default="")
    quoted_rate = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=24, choices=ApplicationStatus.choices, default=ApplicationStatus.APPLIED)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("campaign", "creator")
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.creator.display_name} -> {self.campaign.title}"


class BrandShortlist(models.Model):
    shortlist_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    brand = models.ForeignKey(BrandProfile, on_delete=models.CASCADE, related_name="shortlists")
    creator = models.ForeignKey(CreatorProfile, on_delete=models.CASCADE, related_name="shortlisted_by")
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ("brand", "creator")
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.brand.company_name} - {self.creator.display_name}"
