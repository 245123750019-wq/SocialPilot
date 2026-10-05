import os

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from google.auth.transport.requests import Request


def publish_youtube_video(
    access_token: str,
    refresh_token: str,
    video_path: str,
    title: str,
    description: str = ""
):
    if not access_token:
        raise Exception("YouTube access token is not configured.")

    if not refresh_token:
        raise Exception("YouTube refresh token is not configured.")

    if not os.path.exists(video_path):
        raise Exception("YouTube video file was not found.")

    credentials = Credentials(
        token=access_token,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.getenv("YOUTUBE_CLIENT_ID"),
        client_secret=os.getenv("YOUTUBE_CLIENT_SECRET"),
        scopes=None
    )

    if credentials.expired:
        credentials.refresh(Request())

    youtube = build(
        "youtube",
        "v3",
        credentials=credentials
    )

    request_body = {
        "snippet": {
            "title": title,
            "description": description
        },
        "status": {
            "privacyStatus": "private"
        }
    }

    media = MediaFileUpload(
        video_path,
        resumable=True
    )

    request = youtube.videos().insert(
        part="snippet,status",
        body=request_body,
        media_body=media
    )

    response = request.execute()

    return response