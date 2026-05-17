from dataclasses import dataclass
from django.db.models import Avg
from .models import Campaign, Creator, CampaignCreator


@dataclass
class MatchScore:
    creator_id: str
    campaign_id: str
    score: float


class MatchingService:
    @staticmethod
    def compute_score(campaign: Campaign, creator: Creator) -> float:
        category_overlap = campaign.categories.filter(id__in=creator.categories.values("id")).count()
        tag_overlap = campaign.tags.filter(id__in=creator.tags.values("id")).count()
        avg_er = creator.platforms.aggregate(v=Avg("engagement_rate"))["v"] or 0
        avg_quality = creator.platforms.aggregate(v=Avg("audience_quality_score"))["v"] or 0
        authenticity = creator.authenticity_score or 0

        score = (
            min(category_overlap * 15, 30)
            + min(tag_overlap * 7, 20)
            + min(avg_er * 2, 20)
            + min(avg_quality * 0.2, 15)
            + min(authenticity * 0.15, 15)
        )
        return round(min(score, 100), 2)

    @classmethod
    def rank_creators_for_campaign(cls, campaign: Campaign):
        creators = Creator.objects.filter(is_deleted=False, verification_status="VERIFIED")
        ranked = []
        for creator in creators:
            score = cls.compute_score(campaign, creator)
            rel, _ = CampaignCreator.objects.get_or_create(campaign=campaign, creator=creator)
            rel.matching_score = score
            rel.save(update_fields=["matching_score", "updated_at"])
            ranked.append(MatchScore(str(creator.id), str(campaign.id), score))

        ranked.sort(key=lambda item: item.score, reverse=True)
        return ranked
