import os
import requests
from dotenv import load_dotenv

load_dotenv()




META_GRAPH_API_VERSION = os.getenv("META_GRAPH_API_VERSION") or "REPLACE_WITH_META_API_VERSION"

META_GRAPH_API_URL = f"https://graph.facebook.com/{META_GRAPH_API_VERSION}"


def create_instagram_media_container(
    instagram_user_id: str,
    access_token: str,
    image_url: str,
    caption: str,
):
    """
    Creates an Instagram media container.

    The image must be available through a publicly accessible URL.
    """

    url = f"{META_GRAPH_API_URL}/{instagram_user_id}/media"

    data = {
        "image_url": image_url,
        "caption": caption,
        "access_token": access_token,
    }

    response = requests.post(url, data=data, timeout=30)

    if not response.ok:
        raise Exception(
            f"Instagram media container creation failed: "
            f"{response.status_code} - {response.text}"
        )

    return response.json()


def publish_instagram_media(
    instagram_user_id: str,
    access_token: str,
    creation_id: str,
):
    """
    Publishes an already-created Instagram media container.
    """

    url = f"{META_GRAPH_API_URL}/{instagram_user_id}/media_publish"

    data = {
        "creation_id": creation_id,
        "access_token": access_token,
    }

    response = requests.post(url, data=data, timeout=30)

    if not response.ok:
        raise Exception(
            f"Instagram media publishing failed: "
            f"{response.status_code} - {response.text}"
        )

    return response.json()


def publish_instagram_image(
    instagram_user_id: str,
    access_token: str,
    image_url: str,
    caption: str = "",
):
    """
    Creates an Instagram image container and publishes it.
    """

    container = create_instagram_media_container(
        instagram_user_id=instagram_user_id,
        access_token=access_token,
        image_url=image_url,
        caption=caption,
    )

    creation_id = container.get("id")

    if not creation_id:
        raise Exception(
            f"Instagram API did not return a creation ID: {container}"
        )

    result = publish_instagram_media(
        instagram_user_id=instagram_user_id,
        access_token=access_token,
        creation_id=creation_id,
    )

    return result