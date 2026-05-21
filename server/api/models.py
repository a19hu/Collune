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

class SocialMediaPlatform(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=80, unique=True)
    link = models.URLField(blank=True)

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


class BrandProfile(models.Model):
    brand = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    company_discription = models.TextField(blank=True)
    company_category = models.ManyToManyField(Category, blank=True, related_name="brand_profiles")
    created_by = models.ForeignKey(User,on_delete=models.SET_NULL,null=True,related_name="brands_created")    
    social_media_links = models.ManyToManyField(SocialMediaPlatform, blank=True, related_name="brand_profiles")
    Address = models.TextField(blank=True)
    state = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    country = models.CharField(max_length=100, blank=True)

    logo = models.ImageField(upload_to="brand/", blank=True, null=True)
    cover_photo = models.ImageField(upload_to="brand/", blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.brand.brand_name} Profile"


class BrandSocialMedia(models.Model):
    brand = models.ForeignKey(
        BrandProfile,
        on_delete=models.CASCADE,
        related_name="social_accounts"
    )
    platform = models.ForeignKey(
        SocialPlatform,
        on_delete=models.CASCADE
    )
    username = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.brand.brand_name} - {self.platform.name}"


class BrandMember(models.Model):
    STATUS = (
        ("Pending", "Pending"),
        ("Active", "Active"),
        ("Inactive", "Inactive")
    )

    brand = models.ForeignKey(BrandProfile, on_delete=models.CASCADE, related_name="member_links")
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="brand_memberships")
    role = models.CharField(max_length=64, default="MEMBER")
    status = models.CharField(max_length=20, choices=STATUS, default="Pending", db_index=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} "

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

    brand = models.OneToOneField(BrandProfile, on_delete=models.CASCADE, related_name="onboarding")
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


class CreatorProfile(models.Model):

    GENDER_CHOICES = (
        ("MALE", "Male"),
        ("FEMALE", "Female"),
        ("OTHER", "Other"),
    )

    LANGUAGE_CHOICES = (
        ("ENGLISH", "English"),
        ("SPANISH", "Spanish"),
        ("FRENCH", "French"),
        ("HINDI", "Hindi"),
        ("MANDARIN", "Mandarin"),
    )   

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    profile_image = models.ImageField(upload_to="creator/profile/", null=True, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    age = models.PositiveIntegerField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    description = models.TextField(blank=True)
    bio = models.TextField()
    languages =ArrayField(models.CharField(max_length=20, choices=LANGUAGE_CHOICES),default=list,blank=True)
    categories = models.ManyToManyField(Category, blank=True, related_name="creators")
    Address = models.TextField(blank=True)
    state = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    country = models.CharField(max_length=100, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.user.first_name + " " + self.user.last_name



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

    # profile_url = models.URLField()
    # followers = models.PositiveBigIntegerField(default=0)
    # following = models.PositiveBigIntegerField(default=0)
    # posts = models.PositiveBigIntegerField(default=0)
    # average_views = models.PositiveBigIntegerField(default=0)
    # engagement_rate = models.FloatField(default=0)
    # fetched_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.creator.user.first_name} {self.creator.user.last_name} - {self.platform.name}"


class CreatorRating(models.Model):
    brand = models.ForeignKey(BrandProfile, on_delete=models.CASCADE, related_name="creator_ratings")
    creator = models.ForeignKey(CreatorProfile, on_delete=models.CASCADE, related_name="ratings")
    rating = models.PositiveSmallIntegerField()
    review = models.TextField(blank=True)
    collaboration_notes = models.TextField(blank=True)
    would_work_again = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("brand", "creator")

    def __str__(self):
        return f"{self.brand_id} -> {self.creator_id} ({self.rating})"


class SavedCreator(models.Model):
    brand = models.ForeignKey(BrandProfile, on_delete=models.CASCADE, related_name="saved_creators")
    creator = models.ForeignKey(CreatorProfile, on_delete=models.CASCADE, related_name="saved_by_brands")
    note = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("brand", "creator")

    def __str__(self):
        return f"{self.brand_id} saved {self.creator_id}"


class CreatorCartItem(models.Model):
    brand = models.ForeignKey(BrandProfile, on_delete=models.CASCADE, related_name="creator_cart_items")
    creator = models.ForeignKey(CreatorProfile, on_delete=models.CASCADE, related_name="in_brand_carts")
    campaign_goal = models.CharField(max_length=255, blank=True)
    proposed_budget = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("brand", "creator")

    def __str__(self):
        return f"{self.brand_id} cart {self.creator_id}"
