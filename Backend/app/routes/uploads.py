import os
import uuid

from fastapi import APIRouter, UploadFile, File, HTTPException

router = APIRouter(
    prefix="/uploads",
    tags=["Uploads"]
)

UPLOAD_DIR = "uploads"

os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/video")
async def upload_video(
    file: UploadFile = File(...)
):
    if not file.content_type:
        raise HTTPException(
            status_code=400,
            detail="File type could not be determined."
        )

    if not file.content_type.startswith("video/"):
        raise HTTPException(
            status_code=400,
            detail="Only video files are allowed."
        )

    file_extension = os.path.splitext(
        file.filename or ""
    )[1]

    filename = f"{uuid.uuid4()}{file_extension}"

    file_path = os.path.join(
        UPLOAD_DIR,
        filename
    )

    with open(file_path, "wb") as buffer:
        while True:
            chunk = await file.read(1024 * 1024)

            if not chunk:
                break

            buffer.write(chunk)

    return {
        "message": "Video uploaded successfully",
        "file_path": file_path,
        "filename": filename
    }