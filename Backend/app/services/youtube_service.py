
import os
import tempfile

from supabase import create_client
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

    credentials = Credentials(
        token=access_token,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.getenv("YOUTUBE_CLIENT_ID"),
        client_secret=os.getenv("YOUTUBE_CLIENT_SECRET"),
        scopes=["https://www.googleapis.com/auth/youtube.upload"]
    )

    if credentials.expired:
        credentials.refresh(Request())

    youtube = build(
        "youtube",
        "v3",
        credentials=credentials
    )

    # Download the video from Supabase Storage to a temporary file.
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_key:
        raise Exception("Supabase Storage is not configured.")

    supabase = create_client(supabase_url, supabase_key)

    temporary_path = None

    try:
        if os.path.isfile(video_path):
            # Support existing local video paths too.
            temporary_path = video_path
        else:
            video_data = supabase.storage.from_(
                "socialpilot-videos"
            ).download(video_path)

            with tempfile.NamedTemporaryFile(
                suffix=os.path.splitext(video_path)[1] or ".mp4",
                delete=False
            ) as temporary_file:
                temporary_file.write(video_data)
                temporary_path = temporary_file.name

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
            temporary_path,
            mimetype="video/*",
            resumable=True
        )

        request = youtube.videos().insert(
            part="snippet,status",
            body=request_body,
            media_body=media
        )

        return request.execute()

    finally:
        if temporary_path and not os.path.isfile(video_path):
            try:
                os.remove(temporary_path)
            except OSError:
                pass
