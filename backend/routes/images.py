"""
Exam Images Routes
Uploads and manages exam-related images linked to an exam (and indirectly to a patient)
"""

from fastapi import APIRouter, HTTPException, File, Form, UploadFile
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import os
import uuid
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

# Response model
class ExamImageResponse(BaseModel):
    id: str
    exam_id: str
    file_path: str
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
        file_path = f"{exam_id}/{unique_filename}"

        # Read file content
        file_bytes = await file.read()

        # Upload to Supabase Storage bucket (private)
        storage_response = supabase.storage.from_("exam-images").upload(
            file_path, file_bytes
        )

        if "error" in storage_response:
            raise HTTPException(status_code=500, detail="Error uploading file to storage")

        # Save record in DB
        db_insert = supabase.table("exam_images").insert({
            "exam_id": exam_id,
            "file_path": file_path
        }).execute()

        if not db_insert.data:
            raise HTTPException(status_code=500, detail="Error saving image record in database")

        return db_insert.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload error: {str(e)}")


@router.get("/exams/{exam_id}/images")
def get_exam_images(exam_id: str):
    query = supabase.table("exam_images").select("image_path").eq("exam_id", exam_id).execute()
    if query.get("error"):
        raise HTTPException(status_code=400, detail=query["error"]["message"])

    signed_urls = [
        supabase.storage.from_("images").create_signed_url(path["image_path"], 3600)["signedURL"]
        for path in query.data
    ]

    return {"exam_id": exam_id, "images": signed_urls}
