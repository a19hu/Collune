from celery import shared_task
from django.utils import timezone
from .models import Campaign, CreatorPlatform, AnalyticsSnapshot, Notification, User
from .services import MatchingService


@shared_task
def run_campaign_matching(campaign_id):
    campaign = Campaign.objects.get(id=campaign_id, is_deleted=False)
    ranked = MatchingService.rank_creators_for_campaign(campaign)
    return [{"creator_id": item.creator_id, "score": item.score} for item in ranked]


@shared_task
def aggregate_creator_analytics(creator_platform_id):
    cp = CreatorPlatform.objects.get(id=creator_platform_id, is_deleted=False)
    AnalyticsSnapshot.objects.update_or_create(
        creator_platform=cp,
        snapshot_date=timezone.now().date(),
        defaults={
            "followers": cp.followers,
            "engagement": cp.engagement_rate,
            "reach": int(cp.followers * 0.6),
            "impressions": int(cp.followers * 1.2),
            "saves": int(cp.followers * 0.03),
            "shares": int(cp.followers * 0.02),
            "ctr": round(cp.engagement_rate * 0.1, 2),
            "sentiment_score": 70,
            "fake_follower_score": max(0, 100 - cp.audience_quality_score),
        },
    )


@shared_task
def send_in_app_notification(user_id, title, message):
    user = User.objects.get(id=user_id)
    Notification.objects.create(user=user, title=title, message=message, notification_type="IN_APP")
