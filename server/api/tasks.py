# from celery import shared_task
# from django.utils import timezone
# from .models import Campaign, User
# from .services import MatchingService


# @shared_task
# def run_campaign_matching(campaign_id):
#     campaign = Campaign.objects.get(id=campaign_id, is_deleted=False)
#     ranked = MatchingService.rank_creators_for_campaign(campaign)
#     return [{"creator_id": item.creator_id, "score": item.score} for item in ranked]


# # @shared_task
# # def send_in_app_notification(user_id, title, message):
# #     user = User.objects.get(id=user_id)
# #     Notification.objects.create(user=user, title=title, message=message, notification_type="IN_APP")
