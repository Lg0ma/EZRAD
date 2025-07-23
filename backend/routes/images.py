"""
Image processing and management routes for EZRAD application
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import os
import uuid
import shutil
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY in environment!")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Create router
router = APIRouter()

# Configuration
UPLOAD_DIRECTORY = "uploads/images"
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".dcm", ".dicom"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

# Ensure upload directory exists
os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)

# Pydantic models
class ImageCreate(BaseModel):
    exam_id: int
    image_type: str
    description: Optional[str] = None

class ImageUpdate(BaseModel):
    description: Optional[str] = None
    analysis_results: Optional[str] = None
    status: Optional[str] = None

class ImageResponse(BaseModel):
    id: int
    exam_id: int
    filename: str
    original_filename: str
    file_path: str
    file_size: int
    image_type: str
    description: Optional[str]
    analysis_results: Optional[str]
    status: str
    uploaded_at: str
    processed_at: Optional[str]

# Utility functions
def validate_file(file: UploadFile) -> bool:
    """Validate uploaded file"""
    # Check file extension
    file_extension = Path(file.filename).suffix.lower()
    if file_extension not in ALLOWED_EXTENSIONS:
        return False
    
    # Check file size (this is approximate, actual size check happens during upload)
    return True

def generate_unique_filename(original_filename: str) -> str:
    """Generate a unique filename while preserving extension"""
    file_extension = Path(original_filename).suffix
    unique_id = str(uuid.uuid4())
    return f"{unique_id}{file_extension}"

def save_uploaded_file(file: UploadFile, filename: str) -> tuple[str, int]:
    """Save uploaded file to disk and return file path and size"""
    file_path = os.path.join(UPLOAD_DIRECTORY, filename)
    file_size = 0
    
    with open(file_path, "wb") as buffer:
        while content := file.file.read(1024):
            file_size += len(content)
            if file_size > MAX_FILE_SIZE:
                # Clean up partially uploaded file
                os.remove(file_path)
                raise HTTPException(status_code=413, detail="File too large")
            buffer.write(content)
    
    return file_path, file_size

# Image routes
@router.post("/upload", response_model=ImageResponse)
async def upload_image(
    exam_id: int = Form(...),
    image_type: str = Form(...),
    description: Optional[str] = Form(None),
    file: UploadFile = File(...)
):
    """Upload a new image for an exam"""
    try:
        # Validate file
        if not validate_file(file):
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        
        # Generate unique filename
        unique_filename = generate_unique_filename(file.filename)
        
        # Save file
        file_path, file_size = save_uploaded_file(file, unique_filename)
        
        # Save metadata to database
        result = supabase.table("images").insert({
            "exam_id": exam_id,
            "filename": unique_filename,
            "original_filename": file.filename,
            "file_path": file_path,
            "file_size": file_size,
            "image_type": image_type,
            "description": description,
            "status": "uploaded",
            "uploaded_at": datetime.utcnow().isoformat()
        }).execute()
        
        if result.data:
            return result.data[0]
        else:
            # Clean up file if database insert failed
            os.remove(file_path)
            raise HTTPException(status_code=400, detail="Failed to save image metadata")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload error: {str(e)}")

@router.get("/", response_model=List[ImageResponse])
async def get_all_images():
    """Get all images"""
    try:
        result = supabase.table("images").select("*").execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/{image_id}", response_model=ImageResponse)
async def get_image_metadata(image_id: int):
    """Get image metadata by ID"""
    try:
        result = supabase.table("images").select("*").eq("id", image_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Image not found")
            
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/{image_id}/download")
async def download_image(image_id: int):
    """Download image file"""
    try:
        # Get image metadata
        result = supabase.table("images").select("*").eq("id", image_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Image not found")
        
        image_data = result.data[0]
        file_path = image_data["file_path"]
        
        # Check if file exists
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Image file not found on disk")
        
        return FileResponse(
            path=file_path,
            filename=image_data["original_filename"],
            media_type="application/octet-stream"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Download error: {str(e)}")

@router.put("/{image_id}", response_model=ImageResponse)
async def update_image(image_id: int, image_update: ImageUpdate):
    """Update image metadata"""
    try:
        update_data = {}
        if image_update.description is not None:
            update_data["description"] = image_update.description
        if image_update.analysis_results is not None:
            update_data["analysis_results"] = image_update.analysis_results
        if image_update.status is not None:
            update_data["status"] = image_update.status
            
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        if image_update.status == "processed":
            update_data["processed_at"] = datetime.utcnow().isoformat()
            
        result = supabase.table("images").update(update_data).eq("id", image_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Image not found")
            
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.delete("/{image_id}")
async def delete_image(image_id: int):
    """Delete image and its file"""
    try:
        # Get image metadata first
        result = supabase.table("images").select("*").eq("id", image_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Image not found")
        
        image_data = result.data[0]
        file_path = image_data["file_path"]
        
        # Delete from database
        delete_result = supabase.table("images").delete().eq("id", image_id).execute()
        
        if delete_result.data:
            # Delete file from disk
            if os.path.exists(file_path):
                os.remove(file_path)
            return {"message": "Image deleted successfully"}
        else:
            raise HTTPException(status_code=400, detail="Failed to delete image")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Delete error: {str(e)}")

@router.get("/exam/{exam_id}", response_model=List[ImageResponse])
async def get_images_by_exam(exam_id: int):
    """Get all images for a specific exam"""
    try:
        result = supabase.table("images").select("*").eq("exam_id", exam_id).execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/type/{image_type}", response_model=List[ImageResponse])
async def get_images_by_type(image_type: str):
    """Get all images of a specific type"""
    try:
        result = supabase.table("images").select("*").eq("image_type", image_type).execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/status/{status}", response_model=List[ImageResponse])
async def get_images_by_status(status: str):
    """Get all images with a specific status"""
    try:
        result = supabase.table("images").select("*").eq("status", status).execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# Utility functions
def get_image_count():
    """Get total number of images"""
    try:
        result = supabase.table("images").select("id", count="exact").execute()
        return result.count
    except Exception as e:
        print(f"Error getting image count: {e}")
        return 0

def get_recent_images(limit: int = 10):
    """Get most recently uploaded images"""
    try:
        result = (supabase.table("images")
                 .select("*")
                 .order("uploaded_at", desc=True)
                 .limit(limit)
                 .execute())
        return result.data
    except Exception as e:
        print(f"Error getting recent images: {e}")
        return []
