"""
Patient management routes for EZRAD application
Comprehensive patient data handling with search and filtering
"""

from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime, date, timedelta
import os
from supabase import create_client, Client
from dotenv import load_dotenv
import re

# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY in environment!")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Create router
router = APIRouter()

# --- Helpers ---------------------------------------------------------------
def normalize_gender_for_db(value: str) -> str:
    """Normalize incoming gender values to the canonical DB values."""
    key = (value or "").strip().lower()
    mapping = {
        "male": "Male",
        "m": "Male",
        "female": "Female",
        "f": "Female",
    }
    if key not in mapping:
        raise ValueError("Gender must be 'Male' or 'Female'")
    return mapping[key]

# Pydantic models
class PatientCreate(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: date
    gender: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    insurance_provider: Optional[str] = None
    policy_number: Optional[str] = None
    group_number: Optional[str] = None
    created_by: Optional[str] = None  # UUID of the user creating the patient
    

    @validator('gender')
    def validate_gender(cls, v):
        return normalize_gender_for_db(v)
    
    @validator('email')
    def validate_email(cls, v):
        if v and not re.match(r'^[\w\.-]+@[\w\.-]+\.\w+$', v):
            raise ValueError('Invalid email format')
        return v
    
    @validator('phone')
    def validate_phone(cls, v):
        # Remove non-digits for validation
        digits_only = re.sub(r'\D', '', v)
        if len(digits_only) < 10:
            raise ValueError('Phone number must have at least 10 digits')
        return v

class PatientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    insurance_provider: Optional[str] = None
    policy_number: Optional[str] = None
    group_number: Optional[str] = None

class PatientResponse(BaseModel):
    id: str
    first_name: str
    last_name: str
    date_of_birth: str
    gender: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    insurance_provider: Optional[str] = None
    policy_number: Optional[str] = None
    group_number: Optional[str] = None
    created_by: Optional[str] = None
    created_at: Optional[str] = None

class PatientSearchParams(BaseModel):
    """Parameters for searching patients"""
    patient_id: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    insurance_provider: Optional[str] = None
    policy_number: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None

class PatientStatistics(BaseModel):
    """Statistics for patients"""
    total_patients: int
    new_patients_today: int
    new_patients_week: int
    new_patients_month: int
    patients_by_gender: Dict[str, int]
    patients_with_insurance: int
    average_age: float
    age_groups: Dict[str, int]

# Main search endpoint with multiple parameters
@router.get("/search", response_model=List[PatientResponse])
async def search_patients(
    patient_id: Optional[str] = Query(None, description="Search by patient ID"),
    first_name: Optional[str] = Query(None, description="Search by first name (partial match)"),
    last_name: Optional[str] = Query(None, description="Search by last name (partial match)"),
    full_name: Optional[str] = Query(None, description="Search by full name (partial match)"),
    phone: Optional[str] = Query(None, description="Search by phone number"),
    email: Optional[str] = Query(None, description="Search by email"),
    date_of_birth: Optional[str] = Query(None, description="Filter by date of birth (YYYY-MM-DD)"),
    gender: Optional[str] = Query(None, description="Filter by gender"),
    insurance_provider: Optional[str] = Query(None, description="Filter by insurance provider"),
    city: Optional[str] = Query(None, description="Filter by city"),
    state: Optional[str] = Query(None, description="Filter by state"),
    sort_by: Optional[str] = Query("created_at", description="Sort by field"),
    sort_order: Optional[str] = Query("desc", description="Sort order (asc or desc)"),
    limit: Optional[int] = Query(100, description="Limit number of results"),
    offset: Optional[int] = Query(0, description="Offset for pagination")
):
    """
    Advanced search endpoint for patients with multiple filter options
    """
    try:
        # Start building the query
        query = supabase.table("patients").select("*")
        
        # Apply filters
        if patient_id:
            query = query.eq("id", patient_id)
        
        if first_name:
            query = query.ilike("first_name", f"%{first_name}%")
        
        if last_name:
            query = query.ilike("last_name", f"%{last_name}%")
        
        if full_name:
            # Search in both first and last name
            query = query.or_(f"first_name.ilike.%{full_name}%,last_name.ilike.%{full_name}%")
        
        if phone:
            # Remove non-digits for search
            phone_digits = re.sub(r'\D', '', phone)
            query = query.ilike("phone", f"%{phone_digits}%")
        
        if email:
            query = query.ilike("email", f"%{email}%")
        
        if date_of_birth:
            query = query.eq("date_of_birth", date_of_birth)
        
        if gender:
            query = query.eq("gender", normalize_gender_for_db(gender))
        
        if insurance_provider:
            query = query.ilike("insurance_provider", f"%{insurance_provider}%")
        
        if city:
            query = query.ilike("city", f"%{city}%")
        
        if state:
            query = query.ilike("state", f"%{state}%")
        
        # Apply sorting
        if sort_order.lower() == "desc":
            query = query.order(sort_by, desc=True)
        else:
            query = query.order(sort_by, desc=False)
        
        # Apply pagination
        query = query.limit(limit).offset(offset)
        
        # Execute query
        result = query.execute()
        
        return result.data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search error: {str(e)}")


# Original CRUD operations
@router.post("/", response_model=PatientResponse)
async def create_patient(patient: PatientCreate):
    """Create a new patient"""
    try:
        patient_data = {
            "first_name": patient.first_name,
            "last_name": patient.last_name,
            "date_of_birth": patient.date_of_birth.isoformat(),
            "gender": normalize_gender_for_db(patient.gender),
            "phone": patient.phone,
            "email": patient.email,
            "address": patient.address,
            "city": patient.city,
            "state": patient.state,
            "zip_code": patient.zip_code,
            "insurance_provider": patient.insurance_provider,
            "policy_number": patient.policy_number,
            "group_number": patient.group_number,
            "created_by": patient.created_by,
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Remove None values
        patient_data = {k: v for k, v in patient_data.items() if v is not None}
        
        result = supabase.table("patients").insert(patient_data).execute()
        
        if result.data:
            return result.data[0]
        else:
            raise HTTPException(status_code=400, detail="Failed to create patient")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/", response_model=List[PatientResponse])
async def get_all_patients(
    limit: int = Query(100, description="Limit number of results"),
    offset: int = Query(0, description="Offset for pagination")
):
    """Get all patients with pagination"""
    try:
        result = supabase.table("patients").select("*").order("created_at", desc=True).limit(limit).offset(offset).execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(patient_id: str):
    """Get a specific patient by ID"""
    try:
        result = supabase.table("patients").select("*").eq("id", patient_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Patient not found")
            
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.put("/{patient_id}", response_model=PatientResponse)
async def update_patient(patient_id: str, patient_update: PatientUpdate):
    """Update a patient's information"""
    try:
        update_data = {}
        
        # Add all provided fields to update
        if patient_update.first_name is not None:
            update_data["first_name"] = patient_update.first_name
        if patient_update.last_name is not None:
            update_data["last_name"] = patient_update.last_name
        if patient_update.date_of_birth is not None:
            update_data["date_of_birth"] = patient_update.date_of_birth.isoformat()
        if patient_update.gender is not None:
            update_data["gender"] = normalize_gender_for_db(patient_update.gender)
        if patient_update.phone is not None:
            update_data["phone"] = patient_update.phone
        if patient_update.email is not None:
            update_data["email"] = patient_update.email
        if patient_update.address is not None:
            update_data["address"] = patient_update.address
        if patient_update.city is not None:
            update_data["city"] = patient_update.city
        if patient_update.state is not None:
            update_data["state"] = patient_update.state
        if patient_update.zip_code is not None:
            update_data["zip_code"] = patient_update.zip_code
        if patient_update.insurance_provider is not None:
            update_data["insurance_provider"] = patient_update.insurance_provider
        if patient_update.policy_number is not None:
            update_data["policy_number"] = patient_update.policy_number
        if patient_update.group_number is not None:
            update_data["group_number"] = patient_update.group_number
            
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
            
        result = supabase.table("patients").update(update_data).eq("id", patient_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Patient not found")
            
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.delete("/{patient_id}")
async def delete_patient(patient_id: str):
    """Delete a patient"""
    try:
        # Check if patient has associated exams
        exams_result = supabase.table("exams").select("id").eq("patient_id", patient_id).limit(1).execute()
        
        if exams_result.data:
            raise HTTPException(
                status_code=400, 
                detail="Cannot delete patient with existing exams. Archive patient instead."
            )
        
        result = supabase.table("patients").delete().eq("id", patient_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Patient not found")
            
        return {"message": "Patient deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# Get patients by age range
@router.get("/age-range/search", response_model=List[PatientResponse])
async def get_patients_by_age_range(
    min_age: int = Query(..., description="Minimum age in years"),
    max_age: int = Query(..., description="Maximum age in years")
):
    """Get patients within a specific age range"""
    try:
        # Calculate date range
        today = date.today()
        max_dob = today - timedelta(days=min_age * 365)
        min_dob = today - timedelta(days=(max_age + 1) * 365)
        
        result = supabase.table("patients").select("*").gte("date_of_birth", min_dob.isoformat()).lte("date_of_birth", max_dob.isoformat()).order("date_of_birth", desc=True).execute()
        
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# Get patient's exam history
@router.get("/{patient_id}/exams")
async def get_patient_exam_history(patient_id: str):
    """Get all exams for a specific patient"""
    try:
        # First verify patient exists
        patient_result = supabase.table("patients").select("id, first_name, last_name").eq("id", patient_id).execute()
        
        if not patient_result.data:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        patient = patient_result.data[0]
        
        # Get all exams for this patient
        exams_result = supabase.table("exams").select("*").eq("patient_id", patient_id).order("exam_date", desc=True).execute()
        
        return {
            "patient": {
                "id": patient["id"],
                "name": f"{patient['first_name']} {patient['last_name']}"
            },
            "total_exams": len(exams_result.data),
            "exams": exams_result.data
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# Utility functions
def calculate_age(date_of_birth: str) -> int:
    """Calculate age from date of birth string"""
    try:
        dob = datetime.strptime(date_of_birth, "%Y-%m-%d").date()
        today = date.today()
        age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        return age
    except:
        return 0

def format_phone(phone: str) -> str:
    """Format phone number for display"""
    digits = re.sub(r'\D', '', phone)
    if len(digits) == 10:
        return f"({digits[:3]}) {digits[3:6]}-{digits[6:]}"
    return phone

def get_patient_count() -> int:
    """Get total number of patients"""
    try:
        result = supabase.table("patients").select("id", count="exact").execute()
        return result.count
    except Exception as e:
        print(f"Error getting patient count: {e}")
        return 0