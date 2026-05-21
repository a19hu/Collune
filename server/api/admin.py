from django.contrib import admin
from . import models


REGISTER_MODELS = [
    models.Brand,
    models.User,
    models.BrandMember,
    models.BrandOnboarding,
    models.Address,
    models.BrandProfile,
    models.Category,
    models.Tag,
    models.OTPVerification,
    models.SocialMediaPlatform,
]

for m in REGISTER_MODELS:
    admin.site.register(m)

