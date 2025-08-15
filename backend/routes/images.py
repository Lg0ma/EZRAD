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
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY in environment!")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Create router
router = APIRouter()

# Response model
class ExamImageResponse(BaseModel):
    id: str
    exam_id: str
    image_path: str
    created_at: datetime

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}


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
    """Retrieves signed URLs for all images associated with an exam"""
    try:
        uuid.UUID(exam_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID format for exam_id")

    query = supabase.table("exam_images").select("image_path").eq("exam_id", exam_id).execute()

    if query.error:
        raise HTTPException(status_code=400, detail=query.error.message)

    signed_urls = []
    if query.data:
        image_paths = [path["image_path"] for path in query.data]
        
        # This call returns a list of dicts, not a response object with .error
        response_list = supabase.storage.from_("exam-images").create_signed_urls(image_paths, 3600)
        
        signed_urls = [item['signedURL'] for item in response_list if item and 'signedURL' in item]

    return {"exam_id": exam_id, "images": signed_urls}
