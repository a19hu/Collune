from django.contrib import admin
from . import models


REGISTER_MODELS = [
    models.Brand,
    models.BrandMember,
    models.BrandOnboarding,
    models.Address,
]

for m in REGISTER_MODELS:
    admin.site.register(m)
