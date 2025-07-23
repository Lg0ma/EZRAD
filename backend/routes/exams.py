"""
Exam management routes for EZRAD application
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import os
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

# Pydantic models
class ExamCreate(BaseModel):
    patient_name: str
    patient_id: Optional[str] = None
    exam_type: str
    description: Optional[str] = None
    technician_id: int
    doctor_id: Optional[int] = None

class ExamUpdate(BaseModel):
    patient_name: Optional[str] = None
    exam_type: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    doctor_id: Optional[int] = None

class ExamResponse(BaseModel):
    id: int
    patient_name: str
    patient_id: Optional[str]
    exam_type: str
    description: Optional[str]
    status: str
    technician_id: int
    doctor_id: Optional[int]
    created_at: str
    updated_at: Optional[str]

# Exam routes
@router.post("/", response_model=ExamResponse)
async def create_exam(exam: ExamCreate):
    """Create a new exam"""
    try:
        result = supabase.table("exams").insert({
            "patient_name": exam.patient_name,
            "patient_id": exam.patient_id,
            "exam_type": exam.exam_type,
            "description": exam.description,
            "technician_id": exam.technician_id,
            "doctor_id": exam.doctor_id,
            "status": "pending",
            "created_at": datetime.utcnow().isoformat()
        }).execute()
        
        if result.data:
            return result.data[0]
        else:
            raise HTTPException(status_code=400, detail="Failed to create exam")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/", response_model=List[ExamResponse])
async def get_all_exams():
    """Get all exams"""
    try:
        result = supabase.table("exams").select("*").execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/{exam_id}", response_model=ExamResponse)
async def get_exam(exam_id: int):
    """Get a specific exam by ID"""
    try:
        result = supabase.table("exams").select("*").eq("id", exam_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Exam not found")
            
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.put("/{exam_id}", response_model=ExamResponse)
async def update_exam(exam_id: int, exam_update: ExamUpdate):
    """Update an exam's information"""
    try:
        update_data = {}
        if exam_update.patient_name is not None:
            update_data["patient_name"] = exam_update.patient_name
        if exam_update.exam_type is not None:
            update_data["exam_type"] = exam_update.exam_type
        if exam_update.description is not None:
            update_data["description"] = exam_update.description
        if exam_update.status is not None:
            update_data["status"] = exam_update.status
        if exam_update.doctor_id is not None:
            update_data["doctor_id"] = exam_update.doctor_id
            
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        update_data["updated_at"] = datetime.utcnow().isoformat()
            
        result = supabase.table("exams").update(update_data).eq("id", exam_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Exam not found")
            
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.delete("/{exam_id}")
async def delete_exam(exam_id: int):
    """Delete an exam"""
    try:
        result = supabase.table("exams").delete().eq("id", exam_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Exam not found")
            
        return {"message": "Exam deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/patient/{patient_id}", response_model=List[ExamResponse])
async def get_exams_by_patient(patient_id: str):
    """Get all exams for a specific patient"""
    try:
        result = supabase.table("exams").select("*").eq("patient_id", patient_id).execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/technician/{technician_id}", response_model=List[ExamResponse])
async def get_exams_by_technician(technician_id: int):
    """Get all exams by a specific technician"""
    try:
        result = supabase.table("exams").select("*").eq("technician_id", technician_id).execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/status/{status}", response_model=List[ExamResponse])
async def get_exams_by_status(status: str):
    """Get all exams with a specific status"""
    try:
        result = supabase.table("exams").select("*").eq("status", status).execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.patch("/{exam_id}/status")
async def update_exam_status(exam_id: int, status: str):
    """Update only the status of an exam"""
    try:
        result = supabase.table("exams").update({
            "status": status,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", exam_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Exam not found")
            
        return {"message": f"Exam status updated to {status}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# Utility functions
def get_exam_count():
    """Get total number of exams"""
    try:
        result = supabase.table("exams").select("id", count="exact").execute()
        return result.count
    except Exception as e:
        print(f"Error getting exam count: {e}")
        return 0

def get_recent_exams(limit: int = 10):
    """Get most recently created exams"""
    try:
        result = (supabase.table("exams")
                 .select("*")
                 .order("created_at", desc=True)
                 .limit(limit)
                 .execute())
        return result.data
    except Exception as e:
        print(f"Error getting recent exams: {e}")
        return []
