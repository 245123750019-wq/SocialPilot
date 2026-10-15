
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
