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
        valid_genders = ['male', 'female', 'other', 'prefer_not_to_say']
        if v.lower() not in valid_genders:
            raise ValueError(f'Gender must be one of: {", ".join(valid_genders)}')
        return v.lower()
    
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
            query = query.eq("gender", gender.lower())
        
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

# Quick search endpoint (simplified)
@router.get("/quick-search/{search_term}", response_model=List[PatientResponse])
async def quick_search_patients(search_term: str):
    """
    Quick search across multiple fields
    Searches in: patient ID, first name, last name, phone, email
    """
    try:
        patients = []
        
        # Search by ID if search term is UUID-like
        if '-' in search_term and len(search_term) > 30:
            id_result = supabase.table("patients").select("*").eq("id", search_term).execute()
            patients.extend(id_result.data)
        
        # Search by names
        name_result = supabase.table("patients").select("*").or_(
            f"first_name.ilike.%{search_term}%,last_name.ilike.%{search_term}%"
        ).execute()
        patients.extend(name_result.data)
        
        # Search by phone
        phone_digits = re.sub(r'\D', '', search_term)
        if phone_digits:
            phone_result = supabase.table("patients").select("*").ilike("phone", f"%{phone_digits}%").execute()
            patients.extend(phone_result.data)
        
        # Search by email
        if '@' in search_term:
            email_result = supabase.table("patients").select("*").ilike("email", f"%{search_term}%").execute()
            patients.extend(email_result.data)
        
        # Remove duplicates based on ID
        seen_ids = set()
        unique_patients = []
        for patient in patients:
            if patient['id'] not in seen_ids:
                seen_ids.add(patient['id'])
                unique_patients.append(patient)
        
        return unique_patients
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quick search error: {str(e)}")

# Get patient statistics
@router.get("/statistics", response_model=PatientStatistics)
async def get_patient_statistics():
    """Get statistics about patients"""
    try:
        # Get all patients for counting
        all_patients = supabase.table("patients").select("*").execute()
        
        total = len(all_patients.data)
        
        # Count by time period
        now = datetime.now()
        today = now.date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        today_count = sum(1 for p in all_patients.data 
                         if p.get("created_at") and 
                         datetime.fromisoformat(p["created_at"]).date() == today)
        
        week_count = sum(1 for p in all_patients.data 
                        if p.get("created_at") and 
                        datetime.fromisoformat(p["created_at"]).date() >= week_ago)
        
        month_count = sum(1 for p in all_patients.data 
                         if p.get("created_at") and 
                         datetime.fromisoformat(p["created_at"]).date() >= month_ago)
        
        # Count by gender
        gender_counts = {}
        for patient in all_patients.data:
            gender = patient.get("gender", "unknown")
            gender_counts[gender] = gender_counts.get(gender, 0) + 1
        
        # Count with insurance
        with_insurance = sum(1 for p in all_patients.data if p.get("insurance_provider"))
        
        # Calculate average age and age groups
        ages = []
        age_groups = {"0-18": 0, "19-35": 0, "36-50": 0, "51-65": 0, "65+": 0}
        
        for patient in all_patients.data:
            if patient.get("date_of_birth"):
                dob = datetime.strptime(patient["date_of_birth"], "%Y-%m-%d").date()
                age = (today - dob).days // 365
                ages.append(age)
                
                if age <= 18:
                    age_groups["0-18"] += 1
                elif age <= 35:
                    age_groups["19-35"] += 1
                elif age <= 50:
                    age_groups["36-50"] += 1
                elif age <= 65:
                    age_groups["51-65"] += 1
                else:
                    age_groups["65+"] += 1
        
        avg_age = sum(ages) / len(ages) if ages else 0
        
        return PatientStatistics(
            total_patients=total,
            new_patients_today=today_count,
            new_patients_week=week_count,
            new_patients_month=month_count,
            patients_by_gender=gender_counts,
            patients_with_insurance=with_insurance,
            average_age=round(avg_age, 1),
            age_groups=age_groups
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Statistics error: {str(e)}")

# Original CRUD operations
@router.post("/", response_model=PatientResponse)
async def create_patient(patient: PatientCreate):
    """Create a new patient"""
    try:
        patient_data = {
            "first_name": patient.first_name,
            "last_name": patient.last_name,
            "date_of_birth": patient.date_of_birth.isoformat(),
            "gender": patient.gender,
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
            update_data["gender"] = patient_update.gender.lower()
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

# Get patients by insurance provider
@router.get("/insurance/{provider}", response_model=List[PatientResponse])
async def get_patients_by_insurance(provider: str):
    """Get all patients with a specific insurance provider"""
    try:
        result = supabase.table("patients").select("*").ilike("insurance_provider", f"%{provider}%").order("last_name", desc=False).execute()
        return result.data
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

# Get recent patients
@router.get("/recent/list", response_model=List[PatientResponse])
async def get_recent_patients(days: int = 7):
    """Get patients created in the last N days"""
    try:
        cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
        
        result = supabase.table("patients").select("*").gte("created_at", cutoff_date).order("created_at", desc=True).execute()
        
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

# Check for duplicate patients
@router.post("/check-duplicate")
async def check_duplicate_patient(
    first_name: str = Query(..., description="Patient's first name"),
    last_name: str = Query(..., description="Patient's last name"),
    date_of_birth: str = Query(..., description="Patient's date of birth (YYYY-MM-DD)")
):
    """Check if a patient with the same name and DOB already exists"""
    try:
        result = supabase.table("patients").select("*").eq("first_name", first_name).eq("last_name", last_name).eq("date_of_birth", date_of_birth).execute()
        
        if result.data:
            return {
                "duplicate_found": True,
                "patients": result.data,
                "message": f"Found {len(result.data)} patient(s) with the same name and date of birth"
            }
        
        return {
            "duplicate_found": False,
            "message": "No duplicate patients found"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# Batch update insurance information
@router.post("/batch-update-insurance")
async def batch_update_insurance(
    patient_ids: List[str],
    insurance_provider: str,
    policy_number: Optional[str] = None,
    group_number: Optional[str] = None
):
    """Update insurance information for multiple patients at once"""
    try:
        update_data = {
            "insurance_provider": insurance_provider
        }
        
        if policy_number:
            update_data["policy_number"] = policy_number
        if group_number:
            update_data["group_number"] = group_number
        
        results = []
        for patient_id in patient_ids:
            result = supabase.table("patients").update(update_data).eq("id", patient_id).execute()
            if result.data:
                results.append(result.data[0])
        
        return {
            "message": f"Updated insurance for {len(results)} patients",
            "updated_patients": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch update error: {str(e)}")

# Export patients data (returns JSON, could be extended to CSV)
@router.get("/export/data")
async def export_patients_data(
    format: str = Query("json", description="Export format (json or csv)"),
    include_insurance: bool = Query(True, description="Include insurance information"),
    include_address: bool = Query(True, description="Include address information")
):
    """Export patient data in specified format"""
    try:
        # Select fields based on parameters
        fields = ["id", "first_name", "last_name", "date_of_birth", "gender", "phone", "email"]
        
        if include_insurance:
            fields.extend(["insurance_provider", "policy_number", "group_number"])
        
        if include_address:
            fields.extend(["address", "city", "state", "zip_code"])
        
        result = supabase.table("patients").select(",".join(fields)).order("last_name", desc=False).execute()
        
        if format == "json":
            return {
                "export_date": datetime.now().isoformat(),
                "total_patients": len(result.data),
                "patients": result.data
            }
        else:
            # CSV format could be implemented here
            raise HTTPException(status_code=501, detail="CSV export not yet implemented")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export error: {str(e)}")

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