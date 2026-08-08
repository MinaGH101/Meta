import re
import uuid
from pathlib import Path
from fastapi import HTTPException, UploadFile
from PIL import Image
from .config import settings

ALLOWED_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}


def save_image(upload: UploadFile, folder: str = "projects") -> str:
    extension = ALLOWED_TYPES.get(upload.content_type or "")
    if not extension:
        raise HTTPException(status_code=415, detail="Only JPG, PNG and WEBP images are allowed")
    safe_folder = re.sub(r"[^a-zA-Z0-9_-]", "", folder) or "projects"
    target_dir = settings.media_root / safe_folder
    target_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4().hex}{extension}"
    target = target_dir / filename
    total = 0
    with target.open("wb") as output:
        while chunk := upload.file.read(1024 * 1024):
            total += len(chunk)
            if total > settings.max_upload_mb * 1024 * 1024:
                output.close()
                target.unlink(missing_ok=True)
                raise HTTPException(status_code=413, detail="Image is too large")
            output.write(chunk)
    try:
        with Image.open(target) as image:
            image.verify()
    except Exception as exc:
        target.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail="Invalid image file") from exc
    return f"{settings.media_url}/{safe_folder}/{filename}"


def remove_media_file(file_url: str) -> None:
    if not file_url.startswith(settings.media_url + "/"):
        return
    relative = file_url.removeprefix(settings.media_url + "/")
    path = (settings.media_root / relative).resolve()
    root = settings.media_root.resolve()
    if root in path.parents:
        path.unlink(missing_ok=True)
