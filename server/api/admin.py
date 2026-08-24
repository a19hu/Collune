from django.contrib import admin

from .models import (
    AdminPermission,
    AdminRole,
    BrandProfile,
    BrandSavedCreator,
    BrandShortlist,
    Campaign,
    CampaignApplication,
    CreatorProfile,
    CreatorSavedCampaign,
    CreatorSocialAccount,
    OtpVerification,
    User,
    UserAdminRole,
)


admin.site.register(User)
admin.site.register(AdminPermission)
admin.site.register(AdminRole)
admin.site.register(UserAdminRole)
admin.site.register(OtpVerification)
admin.site.register(BrandProfile)
admin.site.register(CreatorProfile)
admin.site.register(CreatorSocialAccount)
admin.site.register(Campaign)
admin.site.register(CampaignApplication)
admin.site.register(BrandShortlist)
admin.site.register(CreatorSavedCampaign)
admin.site.register(BrandSavedCreator)
