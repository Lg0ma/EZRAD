"""
Tech management routes
Migrated from supabaseRoutes.py and organized into a dedicated router
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime
import os
from supabase import create_client, Client
from dotenv import load_dotenv
import uuid

# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY in environment!")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Create router
router = APIRouter()

# Pydantic models matching your Supabase table structure
class TechCreate(BaseModel):
    full_name: str
    office_name: Optional[str] = None
    phone: Optional[str] = None
    
    @validator('full_name')
    def validate_full_name(cls, v):
        if not v or not v.strip():
            raise ValueError('Full name cannot be empty')
        return v.strip()
    
    @validator('phone')
    def validate_phone(cls, v):
        if v is not None:
            # Remove any non-digit characters for validation
            digits_only = ''.join(filter(str.isdigit, v))
            if len(digits_only) < 10:
                raise ValueError('Phone number must have at least 10 digits')
        return v

class TechUpdate(BaseModel):
    full_name: Optional[str] = None
    office_name: Optional[str] = None
    phone: Optional[str] = None
    
    @validator('full_name')
    def validate_full_name(cls, v):
        if v is not None and (not v or not v.strip()):
            raise ValueError('Full name cannot be empty')
        return v.strip() if v else None
    
    @validator('phone')
    def validate_phone(cls, v):
        if v is not None and v.strip():
            # Remove any non-digit characters for validation
            digits_only = ''.join(filter(str.isdigit, v))
            if len(digits_only) < 10:
                raise ValueError('Phone number must have at least 10 digits')
        return v

class TechResponse(BaseModel):
    id: str  # UUID is returned as string
    full_name: str
    office_name: Optional[str] = None
    phone: Optional[str] = None
    created_at: datetime
    
    class Config:
        # This allows Pydantic to work with datetime objects
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

# Tech routes
@router.post("/", response_model=TechResponse)
async def create_tech(tech: TechCreate):
    """Create a new technician in the database"""
    try:
        # Don't manually set created_at - let Supabase handle it with default timestamp
        insert_data = {
            "full_name": tech.full_name,
        }
        
        # Only add optional fields if they're provided
        if tech.office_name is not None:
            insert_data["office_name"] = tech.office_name
        if tech.phone is not None:
            insert_data["phone"] = tech.phone
            
        result = supabase.table("technicians").insert(insert_data).execute()
        
        if result.data:
            return result.data[0]
        else:
            raise HTTPException(status_code=400, detail="Failed to create technician")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/", response_model=List[TechResponse])
async def get_all_techs():
    """Get all technicians from the database"""
    try:
        result = supabase.table("technicians").select("*").execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/{tech_id}", response_model=TechResponse)
async def get_tech(tech_id: str):  # Changed to str for UUID
    """Get a specific technician by ID"""
    try:
        # Validate UUID format
        try:
            uuid.UUID(tech_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid UUID format")
            
        result = supabase.table("technicians").select("*").eq("id", tech_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Technician not found")
            
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.delete("/{tech_id}")
async def delete_tech(tech_id: str):  # Changed to str for UUID
    """Delete a technician from the database"""
    try:
        # Validate UUID format
        try:
            uuid.UUID(tech_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid UUID format")
            
        result = supabase.table("technicians").delete().eq("id", tech_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Technician not found")
            
        return {"message": "Technician deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/search/{name}", response_model=List[TechResponse])
async def search_techs_by_name(name: str):
    """Search technicians by name (case-insensitive partial match)"""
    try:
        result = supabase.table("technicians").select("*").ilike("full_name", f"%{name}%").execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

