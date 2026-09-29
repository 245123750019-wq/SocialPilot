import os
import secrets

from google_auth_oauthlib.flow import Flow


YOUTUBE_SCOPES = [
    "https://www.googleapis.com/auth/youtube.readonly"
]


def create_youtube_flow(code_verifier: str | None = None):
    client_config = {
        "web": {
            "client_id": os.getenv("YOUTUBE_CLIENT_ID"),
            "client_secret": os.getenv("YOUTUBE_CLIENT_SECRET"),
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [
                os.getenv("YOUTUBE_REDIRECT_URI")
            ],
        }
    }

    if code_verifier is None:
        code_verifier = secrets.token_urlsafe(64)

    flow = Flow.from_client_config(
        client_config,
        scopes=YOUTUBE_SCOPES,
        redirect_uri=os.getenv("YOUTUBE_REDIRECT_URI"),
        code_verifier=code_verifier
    )

    return flow