
import os
import requests
from dotenv import load_dotenv

load_dotenv()

GRAPH_API_VERSION = "v26.0"
GRAPH_API_URL = f"https://graph.facebook.com/{GRAPH_API_VERSION}"


def publish_facebook_post(
    page_id: str,
    access_token: str,
    message: str,
    image_url: str | None = None,
):
    if not page_id:
        raise ValueError("Facebook Page ID is not configured.")

    if not access_token:
        raise ValueError("Facebook Page access token is not configured.")

    if not message or not message.strip():
        raise ValueError("Facebook post message cannot be empty.")

    if image_url:
        url = f"{GRAPH_API_URL}/{page_id}/photos"

        response = requests.post(
            url,
            data={
                "url": image_url,
                "caption": message,
                "access_token": access_token,
            },
            timeout=60,
        )
    else:
        url = f"{GRAPH_API_URL}/{page_id}/feed"

        response = requests.post(
            url,
            data={
                "message": message,
                "access_token": access_token,
            },
            timeout=30,
        )

    if not response.ok:
        raise Exception(
            f"Facebook publishing failed: "
            f"{response.status_code} - {response.text}"
        )

    result = response.json()

    if not result.get("id"):
        raise Exception(
            f"Facebook API did not return a post ID: {result}"
        )

    return result
