import os
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import requests


INSTAGRAM_GRAPH_API_URL = "https://graph.instagram.com/v26.0"
FACEBOOK_GRAPH_API_URL = "https://graph.facebook.com/v26.0"


def fetch_instagram_metrics(
    external_post_id: str,
    access_token: str,
) -> dict:
    """Fetch the latest available metrics for a published Instagram post."""

    if not external_post_id or not access_token:
        raise ValueError("Instagram post ID and access token are required.")

    url = f"{INSTAGRAM_GRAPH_API_URL}/{external_post_id}/insights"

    response = requests.get(
        url,
        params={
            "metric": "likes,comments,shares,saved,reach",
            "access_token": access_token,
        },
        timeout=30,
    )

    if not response.ok:
        raise Exception(
            f"Instagram metrics request failed: "
            f"{response.status_code} - {response.text}"
        )

    result = response.json()
    metrics = {}

    for item in result.get("data", []):
        name = item.get("name")
        values = item.get("values", [])

        if name and values:
            metrics[name] = values[0].get("value")

    return metrics


def fetch_facebook_metrics(
    external_post_id: str,
    access_token: str,
) -> dict:
    """Fetch available engagement counts for a published Facebook post."""

    if not external_post_id or not access_token:
        raise ValueError("Facebook post ID and access token are required.")

    url = f"{FACEBOOK_GRAPH_API_URL}/{external_post_id}"

    response = requests.get(
        url,
        params={
            "fields": "likes.summary(true),comments.summary(true),shares",
            "access_token": access_token,
        },
        timeout=30,
    )

    if not response.ok:
        raise Exception(
            f"Facebook metrics request failed: "
            f"{response.status_code} - {response.text}"
        )

    result = response.json()

    likes_data = result.get("likes") or {}
    comments_data = result.get("comments") or {}
    shares_data = result.get("shares") or {}

    return {
        "likes": (likes_data.get("summary") or {}).get("total_count"),
        "comments": (comments_data.get("summary") or {}).get("total_count"),
        "shares": shares_data.get("count"),
    }

def fetch_instagram_follower_count(
    instagram_user_id: str,
    access_token: str,
) -> int:
    """Fetch the current follower count for an Instagram account."""

    if not instagram_user_id or not access_token:
        raise ValueError("Instagram user ID and access token are required.")

    url = f"{INSTAGRAM_GRAPH_API_URL}/{instagram_user_id}"

    response = requests.get(
        url,
        params={
            "fields": "followers_count",
            "access_token": access_token,
        },
        timeout=30,
    )

    if not response.ok:
        # Do not include the access token or full request URL in errors.
        try:
            error_data = response.json().get("error", {})
            message = error_data.get("message", "Unknown Instagram API error")
            code = error_data.get("code", "unknown")
        except ValueError:
            message = "Instagram returned an invalid response"
            code = "unknown"

        raise Exception(
            f"Instagram follower-count request failed "
            f"(HTTP {response.status_code}, code {code}): {message}"
        )

    result = response.json()
    followers_count = result.get("followers_count")

    if not isinstance(followers_count, int):
        raise ValueError("Instagram did not return a valid follower count.")

    return followers_count

def fetch_facebook_follower_count(
    page_id: str,
    access_token: str,
) -> int:
    """Fetch the current follower count for a Facebook Page."""

    if not page_id or not access_token:
        raise ValueError("Facebook Page ID and access token are required.")

    url = f"{FACEBOOK_GRAPH_API_URL}/{page_id}"

    response = requests.get(
        url,
        params={
            "fields": "followers_count",
            "access_token": access_token,
        },
        timeout=30,
    )

    if not response.ok:
        raise Exception(
            f"Facebook follower-count request failed "
            f"(HTTP {response.status_code})."
        )

    result = response.json()
    followers_count = result.get("followers_count")

    if not isinstance(followers_count, int):
        raise ValueError("Facebook did not return a valid follower count.")

    return followers_count


def fetch_youtube_subscriber_count(
    channel_id: str,
    access_token: str,
    refresh_token: str | None = None,
) -> int:
    """Fetch the current subscriber count for a YouTube channel."""

    if not channel_id or not access_token:
        raise ValueError("YouTube channel ID and access token are required.")

    credentials = Credentials(
        token=access_token,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.getenv("YOUTUBE_CLIENT_ID"),
        client_secret=os.getenv("YOUTUBE_CLIENT_SECRET"),
        scopes=["https://www.googleapis.com/auth/youtube.readonly"],
    )

    youtube = build("youtube", "v3", credentials=credentials)

    response = youtube.channels().list(
        part="statistics",
        id=channel_id,
    ).execute()

    channels = response.get("items", [])

    if not channels:
        raise ValueError("YouTube channel was not found.")

    subscriber_count = channels[0].get("statistics", {}).get(
        "subscriberCount"
    )

    if subscriber_count is None:
        raise ValueError("YouTube did not return a subscriber count.")

    return int(subscriber_count)
