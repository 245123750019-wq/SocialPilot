import httpx


X_POST_URL = "https://api.x.com/2/tweets"


def publish_x_post(
    access_token: str,
    text: str
) -> dict:

    if not access_token:
        raise Exception(
            "X access token is not configured."
        )

    if not text or not text.strip():
        raise Exception(
            "X post content is empty."
        )

    response = httpx.post(
        X_POST_URL,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        },
        json={
            "text": text
        },
        timeout=30
    )

    if response.status_code >= 400:
        raise Exception(
            f"X publishing failed: "
            f"{response.status_code} - {response.text}"
        )

    return response.json()