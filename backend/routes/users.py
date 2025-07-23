"""
User management routes
Migrated from supabaseRoutes.py and organized into a dedicated router
"""

from fastapi import APIRouter, HTTPException
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
class UserCreate(BaseModel):
    email: str
    name: str
    role: Optional[str] = "user"

class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    role: str
    created_at: str

# User routes
@router.post("/", response_model=UserResponse)
async def create_user(user: UserCreate):
    """Create a new user in the database"""
    try:
        result = supabase.table("users").insert({
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "created_at": datetime.utcnow().isoformat()
        }).execute()
        
        if result.data:
            return result.data[0]
        else:
            raise HTTPException(status_code=400, detail="Failed to create user")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/", response_model=List[UserResponse])
async def get_all_users():
    """Get all users from the database"""
    try:
        result = supabase.table("users").select("*").execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: int):
    """Get a specific user by ID"""
    try:
        result = supabase.table("users").select("*").eq("id", user_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="User not found")
            
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/email/{email}", response_model=UserResponse)
async def get_user_by_email(email: str):
    """Get a user by email address"""
    try:
        result = supabase.table("users").select("*").eq("email", email).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="User not found")
            
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(user_id: int, user_update: UserUpdate):
    """Update a user's information"""
    try:
        update_data = {}
        if user_update.name is not None:
            update_data["name"] = user_update.name
        if user_update.role is not None:
            update_data["role"] = user_update.role
            
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
            
        result = supabase.table("users").update(update_data).eq("id", user_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="User not found")
            
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.delete("/{user_id}")
async def delete_user(user_id: int):
    """Delete a user from the database"""
    try:
        result = supabase.table("users").delete().eq("id", user_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="User not found")
            
        return {"message": "User deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/role/{role}", response_model=List[UserResponse])
async def get_users_by_role(role: str):
    """Get all users with a specific role"""
    try:
        result = supabase.table("users").select("*").eq("role", role).execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/search/{name}", response_model=List[UserResponse])
async def search_users_by_name(name: str):
    """Search users by name (case-insensitive partial match)"""
    try:
        result = supabase.table("users").select("*").ilike("name", f"%{name}%").execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# Utility functions
def get_user_count():
    """Get total number of users"""
    try:
        result = supabase.table("users").select("id", count="exact").execute()
        return result.count
    except Exception as e:
        print(f"Error getting user count: {e}")
        return 0

def get_recent_users(limit: int = 5):
    """Get most recently created users"""
    try:
        result = (supabase.table("users")
                 .select("*")
                 .order("created_at", desc=True)
                 .limit(limit)
                 .execute())
        return result.data
    except Exception as e:
        print(f"Error getting recent users: {e}")
        return []
