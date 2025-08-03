"""
FastAPI Router Setup for EZRAD Application
This file contains the router configuration and setup for organizing API endpoints
"""

from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import your route modules here (with error handling)
try:
    from .routes import exams, images, database, techs
    ROUTES_AVAILABLE = True
except ImportError:
    try:
        from routes import exams, images, database, techs
        ROUTES_AVAILABLE = True
    except ImportError as e:
        logger.warning(f"Route modules not available: {e}")
        ROUTES_AVAILABLE = False

# Create main API router
api_router = APIRouter(prefix="/api/v1")

# Health check router (no prefix needed)
health_router = APIRouter()

@health_router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "EZRAD API",
        "version": "1.0.0"
    }

@health_router.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "EZRAD API is running",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

# Include route modules in the API router
def setup_routers():
    """
    Setup and configure all routers for the application
    """
    if not ROUTES_AVAILABLE:
        logger.warning("Routes not available, setting up minimal configuration")
        return api_router, health_router
    
    try:
        # User management routes
        api_router.include_router(
            techs.router,
            prefix="/techs",
            tags=["techs"],
            responses={404: {"description": "Technician not found"}}
        )
        
        # Exam management routes
        api_router.include_router(
            exams.router,
            prefix="/exams",
            tags=["exams"],
            responses={404: {"description": "Exam not found"}}
        )
        
        # Image processing routes
        api_router.include_router(
            images.router,
            prefix="/images",
            tags=["images"],
            responses={404: {"description": "Image not found"}}
        )
        
        # Database management routes
        api_router.include_router(
            database.router,
            prefix="/database",
            tags=["database"],
            responses={500: {"description": "Database operation failed"}}
        )
        
        logger.info("All routers configured successfully")
        
    except Exception as e:
        logger.error(f"Error configuring routes: {e}")
        logger.info("Application will continue with basic routes only")
    
    return api_router, health_router

# Optional: Router for admin-only endpoints
admin_router = APIRouter(prefix="/admin", tags=["admin"])

@admin_router.get("/stats")
async def get_system_stats():
    """
    Get system statistics
    """
    return {
        "total_users": 0,
        "total_exams": 0,
        "total_images": 0,
        "system_status": "operational"
    }

# Rate limiting and middleware setup (optional)
class RouterConfig:
    """Configuration class for router settings"""
    
    def __init__(self):
        self.rate_limit_enabled = True
        self.cors_enabled = True
        self.logging_enabled = True
    
    def configure_middleware(self, app):
        """Configure middleware for the application"""
        if self.cors_enabled:
            from fastapi.middleware.cors import CORSMiddleware
            app.add_middleware(
                CORSMiddleware,
                allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
                allow_credentials=True,
                allow_methods=["*"],
                allow_headers=["*"],
            )
        
        if self.logging_enabled:
            # Add request logging middleware
            @app.middleware("http")
            async def log_requests(request, call_next):
                logger.info(f"{request.method} {request.url}")
                response = await call_next(request)
                logger.info(f"Response status: {response.status_code}")
                return response

# Export the main components
__all__ = [
    "api_router",
    "health_router", 
    "admin_router",
    "setup_routers",
    "RouterConfig"
]
