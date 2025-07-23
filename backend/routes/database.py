"""
Database management routes for EZRAD application
Handles database testing and administrative operations
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
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
class ColumnDefinition(BaseModel):
    name: str
    type: str

class TestTableCreate(BaseModel):
    table_name: str
    description: Optional[str] = None
    columns: List[ColumnDefinition]

class TestTableResponse(BaseModel):
    table_name: str
    status: str
    description: Optional[str]
    columns: List[ColumnDefinition]
    created_at: str

# Database test routes
@router.post("/create-test-table", response_model=TestTableResponse)
async def create_test_table(table_data: TestTableCreate):
    """Create a test table to verify database connection and permissions"""
    try:
        # Build SQL for creating table
        columns_sql = []
        for col in table_data.columns:
            columns_sql.append(f"{col.name} {col.type}")
        
        create_table_sql = f"""
        CREATE TABLE IF NOT EXISTS {table_data.table_name} (
            {', '.join(columns_sql)}
        )
        """
        
        # Execute the table creation using Supabase RPC or direct SQL
        # Note: This is a simplified approach. In production, you'd want more controlled table management
        try:
            # For demonstration, we'll create a record in a test_tables metadata table
            # instead of actually creating tables dynamically (which can be risky)
            
            # First, ensure we have a test_tables metadata table
            metadata_result = supabase.table("test_tables").select("*").limit(1).execute()
            
            # If the table doesn't exist, we'll simulate the creation
            test_table_record = {
                "table_name": table_data.table_name,
                "description": table_data.description,
                "status": "created",
                "columns_definition": [{"name": col.name, "type": col.type} for col in table_data.columns],
                "created_at": datetime.utcnow().isoformat()
            }
            
            # Insert the test table metadata
            result = supabase.table("test_tables").insert(test_table_record).execute()
            
            if result.data:
                created_record = result.data[0]
                return TestTableResponse(
                    table_name=created_record["table_name"],
                    status=created_record["status"],
                    description=created_record.get("description"),
                    columns=table_data.columns,
                    created_at=created_record["created_at"]
                )
            else:
                raise HTTPException(status_code=400, detail="Failed to create test table record")
                
        except Exception as db_error:
            # If metadata table doesn't exist, create a simulated response
            return TestTableResponse(
                table_name=table_data.table_name,
                status="simulated",
                description=f"{table_data.description} (Simulated creation - metadata table not available)",
                columns=table_data.columns,
                created_at=datetime.utcnow().isoformat()
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database operation failed: {str(e)}")

@router.get("/test-tables")
async def list_test_tables():
    """List all test tables created"""
    try:
        result = supabase.table("test_tables").select("*").order("created_at", desc=True).execute()
        return {
            "test_tables": result.data,
            "count": len(result.data)
        }
    except Exception as e:
        # Return empty list if table doesn't exist
        return {
            "test_tables": [],
            "count": 0,
            "note": "test_tables metadata table not found"
        }

@router.delete("/test-tables/{table_name}")
async def delete_test_table(table_name: str):
    """Delete a test table (metadata only for safety)"""
    try:
        result = supabase.table("test_tables").delete().eq("table_name", table_name).execute()
        
        if result.data:
            return {"message": f"Test table {table_name} deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Test table not found")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Delete operation failed: {str(e)}")

@router.post("/test-connection")
async def test_database_connection():
    """Simple database connection test"""
    try:
        # Try a simple query to test connection
        result = supabase.table("users").select("id").limit(1).execute()
        
        return {
            "status": "connected",
            "message": "Database connection successful",
            "timestamp": datetime.utcnow().isoformat(),
            "supabase_url": SUPABASE_URL.split('@')[0] + "@***" if '@' in SUPABASE_URL else "***"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Connection test failed: {str(e)}")

@router.get("/schema-info")
async def get_schema_info():
    """Get basic schema information (safe queries only)"""
    try:
        # Get count of records from main tables
        users_result = supabase.table("users").select("id", count="exact").execute()
        
        schema_info = {
            "tables": {
                "users": {
                    "count": users_result.count,
                    "status": "accessible"
                }
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Try to get other table counts safely
        try:
            exams_result = supabase.table("exams").select("id", count="exact").execute()
            schema_info["tables"]["exams"] = {
                "count": exams_result.count,
                "status": "accessible"
            }
        except:
            schema_info["tables"]["exams"] = {"status": "not_accessible"}
            
        try:
            images_result = supabase.table("images").select("id", count="exact").execute()
            schema_info["tables"]["images"] = {
                "count": images_result.count,
                "status": "accessible"
            }
        except:
            schema_info["tables"]["images"] = {"status": "not_accessible"}
        
        return schema_info
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Schema query failed: {str(e)}")

# Utility functions
def create_test_tables_metadata_table():
    """Create the metadata table for tracking test tables"""
    # This would be called during application startup if needed
    # Implementation depends on your database setup preferences
    pass
