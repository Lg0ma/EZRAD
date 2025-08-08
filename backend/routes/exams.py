"""
Exam management routes for EZRAD application
Enhanced with comprehensive search functionality
"""

from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date, time, timedelta
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
    technician_id: str
    doctor_id: Optional[str] = None
    scheduled_time: Optional[datetime] = None
    body_part: Optional[str] = None
    priority: Optional[str] = "routine"  # routine, urgent, stat

class ExamUpdate(BaseModel):
    patient_name: Optional[str] = None
    exam_type: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    doctor_id: Optional[str] = None
    scheduled_time: Optional[datetime] = None
    completed_time: Optional[datetime] = None
    body_part: Optional[str] = None
    priority: Optional[str] = None
    notes: Optional[str] = None

class ExamResponse(BaseModel):
    id: str
    patient_name: Optional[str] = None
    patient_id: Optional[str] = None
    exam_type: str
    description: Optional[str] = None
    status: Optional[str] = None
    technician_id: Optional[str] = None
    doctor_id: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    scheduled_time: Optional[str] = None
    completed_time: Optional[str] = None
    body_part: Optional[str] = None
    priority: Optional[str] = None
    notes: Optional[str] = None
    # Include alternate scheduling fields present in DB
    exam_date: Optional[str] = None
    exam_time: Optional[str] = None

class ExamSearchParams(BaseModel):
    """Parameters for searching exams"""
    exam_id: Optional[str] = None
    patient_name: Optional[str] = None
    patient_id: Optional[str] = None
    status: Optional[str] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    time_from: Optional[time] = None
    time_to: Optional[time] = None
    exam_type: Optional[str] = None
    body_part: Optional[str] = None
    priority: Optional[str] = None
    technician_id: Optional[int] = None
    doctor_id: Optional[int] = None

class ExamStatistics(BaseModel):
    """Statistics for exams"""
    total_exams: int
    pending_exams: int
    in_progress_exams: int
    completed_exams: int
    cancelled_exams: int
    today_exams: int
    week_exams: int
    month_exams: int

# Main search endpoint with multiple parameters
@router.get("/search", response_model=List[ExamResponse])
async def search_exams(
    exam_id: Optional[str] = Query(None, description="Search by exam ID"),
    patient_name: Optional[str] = Query(None, description="Search by patient name (partial match)"),
    patient_id: Optional[str] = Query(None, description="Search by patient ID"),
    status: Optional[str] = Query(None, description="Filter by status (pending, in_progress, completed, cancelled)"),
    date_from: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    time_from: Optional[str] = Query(None, description="Start time (HH:MM)"),
    time_to: Optional[str] = Query(None, description="End time (HH:MM)"),
    exam_type: Optional[str] = Query(None, description="Filter by exam type"),
    body_part: Optional[str] = Query(None, description="Filter by body part"),
    priority: Optional[str] = Query(None, description="Filter by priority (routine, urgent, stat)"),
    technician_id: Optional[str] = Query(None, description="Filter by technician ID"),
    doctor_id: Optional[str] = Query(None, description="Filter by doctor ID"),
    sort_by: Optional[str] = Query("created_at", description="Sort by field"),
    sort_order: Optional[str] = Query("desc", description="Sort order (asc or desc)"),
    limit: Optional[int] = Query(100, description="Limit number of results"),
    offset: Optional[int] = Query(0, description="Offset for pagination")
):
    """
    Advanced search endpoint for exams with multiple filter options
    """
    try:
        # Start building the query
        query = supabase.table("exams").select("*")
        
        # Apply filters
        if exam_id:
            query = query.eq("id", exam_id)
        
        if patient_name:
            # Case-insensitive partial match for patient name
            query = query.ilike("patient_name", f"%{patient_name}%")
        
        if patient_id:
            query = query.eq("patient_id", patient_id)
        
        if status:
            query = query.eq("status", status.lower())
        
        if exam_type:
            query = query.ilike("exam_type", f"%{exam_type}%")
        
        if body_part:
            query = query.ilike("body_part", f"%{body_part}%")
        
        if priority:
            query = query.eq("priority", priority.lower())
        
        if technician_id:
            query = query.eq("technician_id", technician_id)
        
        if doctor_id:
            query = query.eq("doctor_id", doctor_id)
        
        # Date range filter
        if date_from:
            datetime_from = f"{date_from} 00:00:00"
            query = query.gte("scheduled_time", datetime_from)
        
        if date_to:
            datetime_to = f"{date_to} 23:59:59"
            query = query.lte("scheduled_time", datetime_to)
        
        # Time range filter (for scheduled_time within any date)
        if time_from and time_to:
            # This would require a custom SQL function in Supabase
            # For now, we'll filter after fetching
            pass
        
        # Apply sorting
        if sort_order.lower() == "desc":
            query = query.order(sort_by, desc=True)
        else:
            query = query.order(sort_by, desc=False)
        
        # Apply pagination
        query = query.limit(limit).offset(offset)
        
        # Execute query
        result = query.execute()
        
        # Additional filtering for time if needed
        filtered_data = result.data
        if time_from or time_to:
            filtered_data = []
            for exam in result.data:
                if exam.get("scheduled_time"):
                    exam_time = datetime.fromisoformat(exam["scheduled_time"]).time()
                    
                    if time_from and time_to:
                        time_from_obj = datetime.strptime(time_from, "%H:%M").time()
                        time_to_obj = datetime.strptime(time_to, "%H:%M").time()
                        if time_from_obj <= exam_time <= time_to_obj:
                            filtered_data.append(exam)
                    elif time_from:
                        time_from_obj = datetime.strptime(time_from, "%H:%M").time()
                        if exam_time >= time_from_obj:
                            filtered_data.append(exam)
                    elif time_to:
                        time_to_obj = datetime.strptime(time_to, "%H:%M").time()
                        if exam_time <= time_to_obj:
                            filtered_data.append(exam)
                else:
                    # Include exams without scheduled time if no time filter
                    if not (time_from or time_to):
                        filtered_data.append(exam)
        
        return filtered_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search error: {str(e)}")

# Quick search endpoint (simplified)
@router.get("/quick-search/{search_term}", response_model=List[ExamResponse])
async def quick_search_exams(search_term: str):
    """
    Quick search across multiple fields
    Searches in: exam ID, patient name, exam type, and description
    """
    try:
        # Try to parse as integer for ID search
        exams = []
        
        # Search by ID if search term is numeric
        if search_term.isdigit():
            id_result = supabase.table("exams").select("*").eq("id", int(search_term)).execute()
            exams.extend(id_result.data)
        
        # Search by patient name
        name_result = supabase.table("exams").select("*").ilike("patient_name", f"%{search_term}%").execute()
        exams.extend(name_result.data)
        
        # Search by exam type
        type_result = supabase.table("exams").select("*").ilike("exam_type", f"%{search_term}%").execute()
        exams.extend(type_result.data)
        
        # Remove duplicates based on ID
        seen_ids = set()
        unique_exams = []
        for exam in exams:
            if exam['id'] not in seen_ids:
                seen_ids.add(exam['id'])
                unique_exams.append(exam)
        
        return unique_exams
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quick search error: {str(e)}")

# Get today's exams
@router.get("/today", response_model=List[ExamResponse])
async def get_todays_exams():
    """Get all exams scheduled for today"""
    try:
        today = datetime.now().date().isoformat()
        # Prefer exam_date/exam_time columns if available
        try:
            result = (
                supabase
                .table("exams")
                .select("*")
                .eq("exam_date", today)
                .order("exam_time", desc=False)
                .execute()
            )
            data = result.data
        except Exception:
            # Fallback to scheduled_time range if exam_date isn't available
            start_of_day = f"{today} 00:00:00"
            end_of_day = f"{today} 23:59:59"
            result = (
                supabase
                .table("exams")
                .select("*")
                .gte("scheduled_time", start_of_day)
                .lte("scheduled_time", end_of_day)
                .order("scheduled_time", desc=False)
                .execute()
            )
            data = result.data
        
        # Normalize records to include expected optional fields
        normalized = []
        for e in data:
            item = {
                **e,
                "patient_name": e.get("patient_name"),
                "description": e.get("description") or e.get("clinical_history"),
                "status": e.get("status") or "pending",
                "technician_id": e.get("technician_id"),
                "doctor_id": e.get("doctor_id"),
                "scheduled_time": e.get("scheduled_time")
                    or (f"{e['exam_date']}T{e['exam_time']}" if e.get("exam_date") and e.get("exam_time") else None),
                "notes": e.get("notes"),
            }
            normalized.append(item)
        return normalized
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# Get upcoming exams
@router.get("/upcoming", response_model=List[ExamResponse])
async def get_upcoming_exams(hours: int = 24):
    """Get upcoming exams within specified hours"""
    try:
        now = datetime.now()
        future_time = now + timedelta(hours=hours)
        
        result = supabase.table("exams").select("*").gte("scheduled_time", now.isoformat()).lte("scheduled_time", future_time.isoformat()).eq("status", "pending").order("scheduled_time", desc=False).execute()
        
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# Get exam statistics
@router.get("/statistics", response_model=ExamStatistics)
async def get_exam_statistics():
    """Get statistics about exams"""
    try:
        # Get all exams for counting
        all_exams = supabase.table("exams").select("*").execute()
        
        # Count by status
        total = len(all_exams.data)
        pending = sum(1 for e in all_exams.data if e.get("status") == "pending")
        in_progress = sum(1 for e in all_exams.data if e.get("status") == "in_progress")
        completed = sum(1 for e in all_exams.data if e.get("status") == "completed")
        cancelled = sum(1 for e in all_exams.data if e.get("status") == "cancelled")
        
        # Count by time period
        now = datetime.now()
        today = now.date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        today_count = sum(1 for e in all_exams.data 
                         if e.get("scheduled_time") and 
                         datetime.fromisoformat(e["scheduled_time"]).date() == today)
        
        week_count = sum(1 for e in all_exams.data 
                        if e.get("scheduled_time") and 
                        datetime.fromisoformat(e["scheduled_time"]).date() >= week_ago)
        
        month_count = sum(1 for e in all_exams.data 
                         if e.get("scheduled_time") and 
                         datetime.fromisoformat(e["scheduled_time"]).date() >= month_ago)
        
        return ExamStatistics(
            total_exams=total,
            pending_exams=pending,
            in_progress_exams=in_progress,
            completed_exams=completed,
            cancelled_exams=cancelled,
            today_exams=today_count,
            week_exams=week_count,
            month_exams=month_count
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Statistics error: {str(e)}")

# Original CRUD operations (enhanced)
@router.post("/", response_model=ExamResponse)
async def create_exam(exam: ExamCreate):
    """Create a new exam"""
    try:
        exam_data = {
            "patient_name": exam.patient_name,
            "patient_id": exam.patient_id,
            "exam_type": exam.exam_type,
            "description": exam.description,
            "technician_id": exam.technician_id,
            "doctor_id": exam.doctor_id,
            "status": "pending",
            "created_at": datetime.utcnow().isoformat(),
            "body_part": exam.body_part,
            "priority": exam.priority or "routine"
        }
        
        if exam.scheduled_time:
            exam_data["scheduled_time"] = exam.scheduled_time.isoformat()
        
        result = supabase.table("exams").insert(exam_data).execute()
        
        if result.data:
            return result.data[0]
        else:
            raise HTTPException(status_code=400, detail="Failed to create exam")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/", response_model=List[ExamResponse])
async def get_all_exams(
    limit: int = Query(100, description="Limit number of results"),
    offset: int = Query(0, description="Offset for pagination")
):
    """Get all exams with pagination"""
    try:
        result = (
            supabase
            .table("exams")
            .select("*")
            .order("created_at", desc=True)
            .limit(limit)
            .offset(offset)
            .execute()
        )
        # Normalize as above to ensure optional fields present
        normalized = []
        for e in result.data:
            item = {
                **e,
                "patient_name": e.get("patient_name"),
                "description": e.get("description") or e.get("clinical_history"),
                "status": e.get("status") or "pending",
                "technician_id": e.get("technician_id"),
                "doctor_id": e.get("doctor_id"),
                "scheduled_time": e.get("scheduled_time")
                    or (f"{e['exam_date']}T{e['exam_time']}" if e.get("exam_date") and e.get("exam_time") else None),
                "notes": e.get("notes"),
            }
            normalized.append(item)
        return normalized
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/{exam_id}", response_model=ExamResponse)
async def get_exam(exam_id: str):
    """Get a specific exam by ID"""
    try:
        result = supabase.table("exams").select("*").eq("id", exam_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Exam not found")
        e = result.data[0]
        return {
            **e,
            "description": e.get("description") or e.get("clinical_history"),
            "status": e.get("status") or "pending",
            "scheduled_time": e.get("scheduled_time")
                or (f"{e['exam_date']}T{e['exam_time']}" if e.get("exam_date") and e.get("exam_time") else None),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.put("/{exam_id}", response_model=ExamResponse)
async def update_exam(exam_id: str, exam_update: ExamUpdate):
    """Update an exam's information"""
    try:
        update_data = {}
        
        # Add all provided fields to update
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
        if exam_update.scheduled_time is not None:
            update_data["scheduled_time"] = exam_update.scheduled_time.isoformat()
        if exam_update.completed_time is not None:
            update_data["completed_time"] = exam_update.completed_time.isoformat()
        if exam_update.body_part is not None:
            update_data["body_part"] = exam_update.body_part
        if exam_update.priority is not None:
            update_data["priority"] = exam_update.priority
        if exam_update.notes is not None:
            update_data["notes"] = exam_update.notes
            
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
async def delete_exam(exam_id: str):
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
    """Get all exams for a specific patient ID"""
    try:
        result = supabase.table("exams").select("*").eq("patient_id", patient_id).order("created_at", desc=True).execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/patient-name/{patient_name}", response_model=List[ExamResponse])
async def get_exams_by_patient_name(patient_name: str):
    """Get all exams for a patient by name (partial match)"""
    try:
        result = supabase.table("exams").select("*").ilike("patient_name", f"%{patient_name}%").order("created_at", desc=True).execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/technician/{technician_id}", response_model=List[ExamResponse])
async def get_exams_by_technician(technician_id: str):
    """Get all exams by a specific technician"""
    try:
        result = supabase.table("exams").select("*").eq("technician_id", technician_id).order("created_at", desc=True).execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/status/{status}", response_model=List[ExamResponse])
async def get_exams_by_status(status: str):
    """Get all exams with a specific status"""
    try:
        result = supabase.table("exams").select("*").eq("status", status.lower()).order("created_at", desc=True).execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.patch("/{exam_id}/status")
async def update_exam_status(exam_id: str, status: str):
    """Update only the status of an exam"""
    try:
        update_data = {
            "status": status.lower(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # If marking as completed, also set completed_time
        if status.lower() == "completed":
            update_data["completed_time"] = datetime.utcnow().isoformat()
        
        result = supabase.table("exams").update(update_data).eq("id", exam_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Exam not found")
            
        return {"message": f"Exam status updated to {status}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/time-range/search", response_model=List[ExamResponse])
async def get_exams_by_time_range(
    start_datetime: str = Query(..., description="Start datetime in ISO format"),
    end_datetime: str = Query(..., description="End datetime in ISO format")
):
    """Get exams within a specific time range"""
    try:
        result = supabase.table("exams").select("*").gte("scheduled_time", start_datetime).lte("scheduled_time", end_datetime).order("scheduled_time", desc=False).execute()
        
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# Batch operations
@router.post("/batch-update-status")
async def batch_update_exam_status(exam_ids: List[str], status: str):
    """Update status for multiple exams at once"""
    try:
        update_data = {
            "status": status.lower(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        if status.lower() == "completed":
            update_data["completed_time"] = datetime.utcnow().isoformat()
        
        results = []
        for exam_id in exam_ids:
            result = supabase.table("exams").update(update_data).eq("id", exam_id).execute()
            if result.data:
                results.append(result.data[0])
        
        return {
            "message": f"Updated {len(results)} exams to status: {status}",
            "updated_exams": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch update error: {str(e)}")

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

def get_priority_exams():
    """Get high priority exams (urgent and stat)"""
    try:
        result = (supabase.table("exams")
                 .select("*")
                 .in_("priority", ["urgent", "stat"])
                 .eq("status", "pending")
                 .order("priority", desc=False)
                 .order("scheduled_time", desc=False)
                 .execute())
        return result.data
    except Exception as e:
        print(f"Error getting priority exams: {e}")
        return []