from django.contrib import admin
from . import models


REGISTER_MODELS = [
    models.User,
    models.BrandMember,
    models.BrandOnboarding,
    models.BrandProfile,
    models.BrandSocialMedia,
    models.CreatorProfile,
    models.CreatorSocialMedia,
]

for m in REGISTER_MODELS:
    admin.site.register(m)

