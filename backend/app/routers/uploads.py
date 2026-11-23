import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from app.models.models import User
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/api/upload", tags=["Uploads"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static", "uploads", "receipts")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".pdf"}
ALLOWED_MIME_TYPES = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "application/pdf": ".pdf"
}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

@router.post("/receipt")
async def upload_receipt(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Securely uploads an expense receipt/proof (image or PDF).
    Returns the URL to access the receipt.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected")

    # Validate extension
    _, ext = os.path.splitext(file.filename.lower())
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Allowed formats: JPG, JPEG, PNG, WEBP, PDF."
        )

    # Read and check size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File size exceeds the 10 MB limit."
        )

    # Generate safe random filename
    unique_id = uuid.uuid4().hex[:12]
    safe_filename = f"receipt_{current_user.id}_{unique_id}{ext}"
    dest_path = os.path.join(UPLOAD_DIR, safe_filename)

    with open(dest_path, "wb") as f:
        f.write(content)

    return {
        "success": True,
        "filename": safe_filename,
        "receipt_url": f"/api/upload/receipts/{safe_filename}",
        "size": len(content),
        "content_type": file.content_type
    }

@router.get("/receipts/{filename}")
def get_receipt(filename: str):
    """Serves the uploaded receipt file."""
    # Sanitize filename
    clean_filename = os.path.basename(filename)
    file_path = os.path.join(UPLOAD_DIR, clean_filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Receipt file not found")

    _, ext = os.path.splitext(clean_filename.lower())
    media_type = "application/octet-stream"
    if ext in [".jpg", ".jpeg"]:
        media_type = "image/jpeg"
    elif ext == ".png":
        media_type = "image/png"
    elif ext == ".webp":
        media_type = "image/webp"
    elif ext == ".pdf":
        media_type = "application/pdf"

    return FileResponse(file_path, media_type=media_type)
