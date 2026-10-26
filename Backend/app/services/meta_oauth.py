
import os
from urllib.parse import urlencode

import requests
from dotenv import load_dotenv

load_dotenv()

META_APP_ID = os.getenv("META_APP_ID")
META_APP_SECRET = os.getenv("META_APP_SECRET")
META_INSTAGRAM_APP_ID = os.getenv("META_INSTAGRAM_APP_ID")
META_INSTAGRAM_APP_SECRET = os.getenv("META_INSTAGRAM_APP_SECRET")
META_INSTAGRAM_REDIRECT_URI = os.getenv(
    "META_INSTAGRAM_REDIRECT_URI"
)
META_FACEBOOK_REDIRECT_URI = os.getenv(
    "META_FACEBOOK_REDIRECT_URI"
)
META_GRAPH_API_VERSION = os.getenv("META_GRAPH_API_VERSION") or "v26.0"

FACEBOOK_GRAPH_URL = (
    f"https://graph.facebook.com/{META_GRAPH_API_VERSION}"
)

INSTAGRAM_SCOPES = [
    "instagram_business_basic",
    "instagram_business_content_publish",
]


FACEBOOK_SCOPES = [
    "pages_show_list",
    "pages_read_engagement",
    "pages_manage_posts",
    "read_insights",
]



def _check_meta_config(redirect_uri: str):
    if not META_APP_ID or not META_APP_SECRET or not redirect_uri:
        raise ValueError(
            "META_APP_ID, META_APP_SECRET, and the platform "
            "redirect URI must be configured in Backend/.env"
        )


def create_instagram_authorization_url(state: str) -> str:
    if (
        not META_INSTAGRAM_APP_ID
        or not META_INSTAGRAM_APP_SECRET
        or not META_INSTAGRAM_REDIRECT_URI
    ):
        raise ValueError(
            "Instagram App ID, App Secret, and Redirect URI must be configured."
        )

    params = {
        "client_id": META_INSTAGRAM_APP_ID,
        "redirect_uri": META_INSTAGRAM_REDIRECT_URI,
        "response_type": "code",
        "scope": ",".join(INSTAGRAM_SCOPES),
        "state": state,
    }

    return "https://www.instagram.com/oauth/authorize?" + urlencode(params)


def exchange_instagram_code(code: str) -> dict:
    if (
        not META_INSTAGRAM_APP_ID
        or not META_INSTAGRAM_APP_SECRET
        or not META_INSTAGRAM_REDIRECT_URI
    ):
        raise ValueError(
            "Instagram App ID, App Secret, and Redirect URI must be configured."
        )

    response = requests.post(
        "https://api.instagram.com/oauth/access_token",
        data={
            "client_id": META_INSTAGRAM_APP_ID,
            "client_secret": META_INSTAGRAM_APP_SECRET,
            "grant_type": "authorization_code",
            "redirect_uri": META_INSTAGRAM_REDIRECT_URI,
            "code": code,
        },
        timeout=30,
    )
    response.raise_for_status()

    token_data = response.json()
    short_lived_token = token_data.get("access_token")

    if not short_lived_token:
        raise ValueError("Instagram did not return an access token.")

    long_lived_response = requests.get(
        "https://graph.instagram.com/access_token",
        params={
            "grant_type": "ig_exchange_token",
            "client_secret": META_INSTAGRAM_APP_SECRET,
            "access_token": short_lived_token,
        },
        timeout=30,
    )
    if not long_lived_response.ok:
        try:
            error_data = long_lived_response.json()
            message = error_data.get("error", {}).get(
                "message", "Unknown Instagram token exchange error"
            )
        except ValueError:
             message = "Instagram returned an unreadable token exchange error."

        raise ValueError(f"Instagram token exchange failed: {message}")

    long_lived_data = long_lived_response.json()
    access_token = long_lived_data.get("access_token")

    if not access_token:
        raise ValueError("Instagram did not return a long-lived access token.")

    return {
        "access_token": access_token,
        "user_id": str(token_data.get("user_id", "")),
    }


def get_instagram_profile(access_token: str) -> dict:
    response = requests.get(
        "https://graph.instagram.com/me",
        params={
            "fields": "user_id,username",
            "access_token": access_token,
        },
        timeout=30,
    )
    response.raise_for_status()

    profile = response.json()

    if not profile.get("username"):
        raise ValueError("Instagram did not return a username.")

    return profile


def create_facebook_authorization_url(state: str) -> str:
    _check_meta_config(META_FACEBOOK_REDIRECT_URI)

    params = {
        "client_id": META_APP_ID,
        "redirect_uri": META_FACEBOOK_REDIRECT_URI,
        "response_type": "code",
        "scope": ",".join(FACEBOOK_SCOPES),
        "state": state,
    }

    return (
        f"https://www.facebook.com/{META_GRAPH_API_VERSION}/dialog/oauth?"
        + urlencode(params)
    )


def exchange_facebook_code(code: str) -> dict:
    _check_meta_config(META_FACEBOOK_REDIRECT_URI)

    response = requests.get(
        f"{FACEBOOK_GRAPH_URL}/oauth/access_token",
        params={
            "client_id": META_APP_ID,
            "client_secret": META_APP_SECRET,
            "redirect_uri": META_FACEBOOK_REDIRECT_URI,
            "code": code,
        },
        timeout=30,
    )
    response.raise_for_status()

    token_data = response.json()

    if not token_data.get("access_token"):
        raise ValueError("Facebook did not return an access token.")

    return token_data


def get_facebook_pages(user_access_token: str) -> list[dict]:
    response = requests.get(
        f"{FACEBOOK_GRAPH_URL}/me/accounts",
        params={
            "fields": "id,name,access_token",
            "access_token": user_access_token,
        },
        timeout=30,
    )
    response.raise_for_status()

    pages = response.json().get("data", [])

    return [
        page
        for page in pages
        if page.get("id")
        and page.get("name")
        and page.get("access_token")
    ]
