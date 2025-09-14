"""
Exam Images Routes
Uploads and manages exam-related images linked to an exam (and indirectly to a patient)
"""

from fastapi import APIRouter, HTTPException, File, Form, UploadFile
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import os
import uuid
from supabase import create_client, Client
from dotenv import load_dotenv
import json # Import the json library for safe parsing

# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY in environment!")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Create router
router = APIRouter()

# Pydantic models
class ExamImageResponse(BaseModel):
    id: str
    exam_id: str
    image_path: str
    description: Optional[str] = None
    created_at: datetime

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}

class ImageDescriptionUpdate(BaseModel):
    image_path: str
    description: str


@router.post("/", response_model=ExamImageResponse)
async def upload_exam_image(
    exam_id: str = Form(...),
    file: UploadFile = File(...)
):
    """Upload an image linked to a specific exam"""
    try:
        # Validate UUID format
        try:
            uuid.UUID(exam_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid UUID format for exam_id")

        # Verify exam exists
        exam_check = supabase.table("exams").select("id").eq("id", exam_id).execute()
        if not exam_check.data:
            raise HTTPException(status_code=404, detail="Exam not found")

        # Generate unique filename and path
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        # This variable holds the path for the storage bucket
        storage_file_path = f"{exam_id}/{unique_filename}"

        # Read file content
        file_bytes = await file.read()

        # Upload to Supabase Storage bucket (private)
        storage_response = supabase.storage.from_("exam-images").upload(
            storage_file_path, file_bytes
        )

        # Check the HTTP status code
        if storage_response.status_code != 200:
            error_detail = "Error uploading file to storage."
            try:
                error_detail = storage_response.json().get("message", error_detail)
            except (json.JSONDecodeError, AttributeError):
                pass
            raise HTTPException(status_code=500, detail=error_detail)

        # Save record in DB
        db_insert = supabase.table("exam_images").insert({
            "exam_id": exam_id,
            "image_path": storage_file_path # Use image_path to match your table
        }).execute()

        # If the insert operation fails, the 'data' list will be empty.
        if not db_insert.data:
            error_message = "Failed to save image record in database and received no data."
            # On failure, the object *will* have an .error attribute we can safely check.
            if hasattr(db_insert, 'error') and db_insert.error:
                error_message = db_insert.error.message
            raise HTTPException(status_code=500, detail=error_message)

        return db_insert.data[0]

    except HTTPException:
        raise
    except Exception as e:
        print(f"UNEXPECTED ERROR: {e}")
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.get("/exams/{exam_id}/images", response_model=dict)
def get_exam_images(exam_id: str):
    """Retrieves signed URLs and descriptions for all images associated with an exam"""
    try:
        try:
            uuid.UUID(exam_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid UUID format for exam_id")

        # Fetch both image_path and description
        query = supabase.table("exam_images").select("image_path, description").eq("exam_id", exam_id).execute()

        images_data = []
        if query.data:
            image_paths = [item["image_path"] for item in query.data]
            
            # Get signed URLs for the image paths
            signed_urls_response = supabase.storage.from_("exam-images").create_signed_urls(image_paths, 3600)

            # Create a map of image_path -> signed_url
            url_map = {path: next((url.get('signedURL') for url in signed_urls_response if url.get('path') == path), None) for path in image_paths}

            # Combine the descriptions with the signed URLs
            for item in query.data:
                signed_url = url_map.get(item["image_path"])
                if signed_url:
                    images_data.append({
                        "url": signed_url,
                        "description": item.get("description", "")
                    })

        return {"exam_id": exam_id, "images": images_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred while fetching images: {str(e)}")


@router.patch("/description", response_model=ExamImageResponse)
async def update_image_description(update_data: ImageDescriptionUpdate):
    """Update the description for a specific exam image."""
    try:
        result = supabase.table("exam_images").update({
            "description": update_data.description
        }).eq("image_path", update_data.image_path).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Image not found with the given path.")

        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")