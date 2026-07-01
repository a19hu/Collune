from datetime import timedelta

import requests
from django.conf import settings
from django.utils import timezone

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
YOUTUBE_CHANNELS_URL = "https://www.googleapis.com/youtube/v3/channels"
YOUTUBE_PLAYLIST_ITEMS_URL = "https://www.googleapis.com/youtube/v3/playlistItems"
YOUTUBE_VIDEOS_URL = "https://www.googleapis.com/youtube/v3/videos"
YOUTUBE_ANALYTICS_REPORTS_URL = "https://youtubeanalytics.googleapis.com/v2/reports"


def parse_youtube_duration_seconds(duration):
    if not duration or not duration.startswith("PT"):
        return 0
    number = ""
    seconds = 0
    for char in duration[2:]:
        if char.isdigit():
            number += char
            continue
        value = int(number or 0)
        number = ""
        if char == "H":
            seconds += value * 3600
        if char == "M":
            seconds += value * 60
        if char == "S":
            seconds += value
    return seconds

def youtube_report(access_token, params):
    response = requests.get(
        YOUTUBE_ANALYTICS_REPORTS_URL,
        headers={"Authorization": f"Bearer {access_token}"},
        params=params,
        timeout=20,
    )
    if not response.ok:
        return {"error": response.text[:500], "status_code": response.status_code}
    data = response.json()
    headers = [item.get("name") for item in data.get("columnHeaders", [])]
    rows = data.get("rows", [])
    return {"headers": headers, "rows": [dict(zip(headers, row)) for row in rows]}

def fetch_youtube_videos(access_token, uploads_playlist_id):
    if not uploads_playlist_id:
        return []

    playlist_response = requests.get(
        YOUTUBE_PLAYLIST_ITEMS_URL,
        headers={"Authorization": f"Bearer {access_token}"},
        params={
            "part": "snippet,contentDetails",
            "playlistId": uploads_playlist_id,
            "maxResults": 50,
        },
        timeout=20,
    )
    if not playlist_response.ok:
        return []

    video_ids = [
        item.get("contentDetails", {}).get("videoId")
        for item in playlist_response.json().get("items", [])
        if item.get("contentDetails", {}).get("videoId")
    ]
    if not video_ids:
        return []

    videos_response = requests.get(
        YOUTUBE_VIDEOS_URL,
        headers={"Authorization": f"Bearer {access_token}"},
        params={
            "part": "snippet,contentDetails,statistics",
            "id": ",".join(video_ids),
            "maxResults": 50,
        },
        timeout=20,
    )
    if not videos_response.ok:
        return []

    videos = []
    for item in videos_response.json().get("items", []):
        snippet = item.get("snippet", {})
        content_details = item.get("contentDetails", {})
        statistics = item.get("statistics", {})
        duration_seconds = parse_youtube_duration_seconds(content_details.get("duration", ""))
        thumbnails = snippet.get("thumbnails", {})
        thumbnail_url = (
            thumbnails.get("high", {}).get("url")
            or thumbnails.get("medium", {}).get("url")
            or thumbnails.get("default", {}).get("url")
            or ""
        )
        videos.append(
            {
                "video_id": item.get("id", ""),
                "title": snippet.get("title", ""),
                "published_at": snippet.get("publishedAt", ""),
                "thumbnail_url": thumbnail_url,
                "duration": content_details.get("duration", ""),
                "duration_seconds": duration_seconds,
                "content_type": "SHORT" if duration_seconds <= 60 else "LONG",
                "view_count": int(statistics.get("viewCount") or 0),
                "like_count": int(statistics.get("likeCount") or 0),
                "comment_count": int(statistics.get("commentCount") or 0),
            }
        )
    return videos

def fetch_youtube_analytics(access_token):
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=90)
    base_params = {
        "ids": "channel==MINE",
        "startDate": start_date.isoformat(),
        "endDate": end_date.isoformat(),
    }

    return {
        "date_range": {"start_date": start_date.isoformat(), "end_date": end_date.isoformat()},
        "summary": youtube_report(
            access_token,
            {
                **base_params,
                "metrics": "views,comments,shares,likes,estimatedMinutesWatched,averageViewDuration",
            },
        ),
        "top_videos": youtube_report(
            access_token,
            {
                **base_params,
                "dimensions": "video",
                "metrics": "views,comments,shares,likes,estimatedMinutesWatched,averageViewDuration",
                "sort": "-views",
                "maxResults": 200,
            },
        ),
        "content_type": youtube_report(
            access_token,
            {
                **base_params,
                "dimensions": "creatorContentType",
                "metrics": "views,comments,shares,likes,estimatedMinutesWatched",
            },
        ),
        "age_gender": youtube_report(
            access_token,
            {
                **base_params,
                "dimensions": "ageGroup,gender",
                "metrics": "viewerPercentage",
            },
        ),
        "location": youtube_report(
            access_token,
            {
                **base_params,
                "dimensions": "country",
                "metrics": "views,estimatedMinutesWatched,averageViewDuration",
                "sort": "-views",
                "maxResults": 25,
            },
        ),
    }

def refresh_youtube_access_token(account):
    if account.access_token and account.expires_at and account.expires_at > timezone.now() + timedelta(minutes=5):
        return account.access_token
    if not account.refresh_token:
        return account.access_token

    token_response = requests.post(
        GOOGLE_TOKEN_URL,
        data={
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "refresh_token": account.refresh_token,
            "grant_type": "refresh_token",
        },
        timeout=20,
    )
    if not token_response.ok:
        return account.access_token

    token_data = token_response.json()
    access_token = token_data.get("access_token", account.access_token)
    expires_in = token_data.get("expires_in")
    account.access_token = access_token
    if expires_in:
        account.expires_at = timezone.now() + timedelta(seconds=int(expires_in))
    account.save(update_fields=["access_token", "expires_at"])
    return access_token

def sync_youtube_account(account):
    access_token = refresh_youtube_access_token(account)
    channel_response = requests.get(
        YOUTUBE_CHANNELS_URL,
        headers={"Authorization": f"Bearer {access_token}"},
        params={"part": "snippet,statistics,contentDetails", "mine": "true"},
        timeout=20,
    )
    if not channel_response.ok:
        return False

    items = channel_response.json().get("items", [])
    if not items:
        return False

    channel = items[0]
    snippet = channel.get("snippet", {})
    statistics = channel.get("statistics", {})
    content_details = channel.get("contentDetails", {})
    uploads_playlist_id = content_details.get("relatedPlaylists", {}).get("uploads", "")
    youtube_videos = fetch_youtube_videos(access_token, uploads_playlist_id)
    youtube_short_video_count = sum(1 for video in youtube_videos if video.get("content_type") == "SHORT")
    youtube_long_video_count = sum(1 for video in youtube_videos if video.get("content_type") == "LONG")
    youtube_analytics = fetch_youtube_analytics(access_token)
    subscribers = int(statistics.get("subscriberCount") or 0)
    videos = int(statistics.get("videoCount") or 0)
    views = int(statistics.get("viewCount") or 0)

    thumbnails = snippet.get("thumbnails", {})
    thumbnail_url = (
        thumbnails.get("high", {}).get("url")
        or thumbnails.get("medium", {}).get("url")
        or thumbnails.get("default", {}).get("url")
        or ""
    )

    account.social_id = channel.get("id", account.social_id)
    account.username = snippet.get("customUrl", "") or snippet.get("title", account.username)
    account.handle = snippet.get("title", account.handle)
    account.url = f"https://www.youtube.com/channel/{account.social_id}" if account.social_id else account.url
    account.followers = subscribers
    account.media_count = videos
    account.view_count = views
    account.youtube_short_video_count = youtube_short_video_count
    account.youtube_long_video_count = youtube_long_video_count
    account.youtube_videos = youtube_videos
    account.youtube_analytics = youtube_analytics
    account.last_synced_at = timezone.now()
    account.provider_data = {
        **(account.provider_data or {}),
        "channel_id": account.social_id,
        "title": snippet.get("title", ""),
        "description": snippet.get("description", ""),
        "custom_url": snippet.get("customUrl", ""),
        "published_at": snippet.get("publishedAt", ""),
        "thumbnail_url": thumbnail_url,
        "subscriber_count": subscribers,
        "video_count": videos,
        "view_count": views,
        "uploads_playlist_id": uploads_playlist_id,
    }
    account.save()
    return True
