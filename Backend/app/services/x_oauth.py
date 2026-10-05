import hashlib
import base64
import os
import secrets

import httpx


X_AUTH_URL = "https://x.com/i/oauth2/authorize"
X_TOKEN_URL = "https://api.x.com/2/oauth2/token"

X_SCOPES = [
    "tweet.read",
    "tweet.write",
    "users.read",
    "offline.access",
]


def generate_code_verifier() -> str:
    return secrets.token_urlsafe(64)


def generate_code_challenge(code_verifier: str) -> str:
    digest = hashlib.sha256(code_verifier.encode("ascii")).digest()
    return base64.urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")


def create_x_authorization_url(state: str, code_verifier: str) -> str:
    code_challenge = generate_code_challenge(code_verifier)

    params = {
        "response_type": "code",
        "client_id": os.getenv("X_CLIENT_ID"),
        "redirect_uri": os.getenv("X_REDIRECT_URI"),
        "scope": " ".join(X_SCOPES),
        "state": state,
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
    }

    query_string = "&".join(
        f"{key}={httpx.QueryParams({key: value})[key]}"
        for key, value in params.items()
    )

    return f"{X_AUTH_URL}?{query_string}"


def exchange_code_for_token(
    code: str,
    code_verifier: str,
) -> dict:

    data = {
        "code": code,
        "grant_type": "authorization_code",
        "client_id": os.getenv("X_CLIENT_ID"),
        "redirect_uri": os.getenv("X_REDIRECT_URI"),
        "code_verifier": code_verifier,
    }

    response = httpx.post(
        X_TOKEN_URL,
        data=data,
        auth=(
            os.getenv("X_CLIENT_ID"),
            os.getenv("X_CLIENT_SECRET"),
        ),
        timeout=30,
    )

    response.raise_for_status()

    return response.json()
def get_x_user(access_token: str) -> dict:
    response = httpx.get(
        "https://api.x.com/2/users/me",
        headers={
            "Authorization": f"Bearer {access_token}"
        },
        timeout=30,
    )

    response.raise_for_status()

    return response.json()