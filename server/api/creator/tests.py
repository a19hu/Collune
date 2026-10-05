from types import SimpleNamespace

from django.test import SimpleTestCase

from api.creator.services import calculate_engagement_rate
from api.creator.views import average_engagement_rate


class EngagementRateTests(SimpleTestCase):
    def test_calculates_average_per_post_engagement_against_followers(self):
        videos = [
            {"like_count": 80, "comment_count": 20},
            {"like_count": 40, "comment_count": 60},
        ]

        self.assertEqual(calculate_engagement_rate(videos, 1_000), 10.0)

    def test_returns_zero_without_an_audience_or_content(self):
        self.assertEqual(calculate_engagement_rate([], 1_000), 0.0)
        self.assertEqual(calculate_engagement_rate([{"like_count": 1}], 0), 0.0)

    def test_weights_the_profile_average_by_platform_audience(self):
        accounts = [
            SimpleNamespace(followers=1_000, engagement_rate=10.0),
            SimpleNamespace(followers=9_000, engagement_rate=2.0),
        ]

        self.assertEqual(average_engagement_rate(accounts), 2.8)
