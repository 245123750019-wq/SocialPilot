
import os
import uuid

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from supabase import create_client, Client

from app.core.security import get_current_user_id

router = APIRouter(
    prefix="/uploads",
    tags=["Uploads"]
)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
BUCKET_NAME = "socialpilot-videos"


def get_supabase_client() -> Client:
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(
            status_code=500,
            detail="Supabase Storage is not configured."
        )

    return create_client(
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY
    )


@router.post("/video")
async def upload_video(
    file: UploadFile = File(...),
    user_id: int = Depends(get_current_user_id)
):
    if not file.content_type or not file.content_type.startswith("video/"):
        raise HTTPException(
            status_code=400,
            detail="Only video files are allowed."
        )

    extension = os.path.splitext(file.filename or "")[1]
    filename = f"{user_id}/{uuid.uuid4()}{extension}"

    try:
        video_data = await file.read()

        supabase = get_supabase_client()

        supabase.storage.from_(BUCKET_NAME).upload(
            path=filename,
            file=video_data,
            file_options={
                "content-type": file.content_type,
                "upsert": "false"
            }
        )

        return {
            "message": "Video uploaded successfully",
            "file_path": filename,
            "filename": filename,
            "storage": "supabase"
        }

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Video upload failed: {str(exc)}"
        )
    finally:
        await file.close()
