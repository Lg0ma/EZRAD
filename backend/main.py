"""
Main FastAPI application for EZRAD
This file sets up the FastAPI app with the router configuration
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import os
import logging
import time
import asyncio
from routes.socket_server import start_socket_server
# Import the router setup
try:
    from router_setup import setup_routers, RouterConfig
    ROUTER_SETUP_AVAILABLE = True
except ImportError as e:
    logging.warning(f"Router setup not available: {e}")
    ROUTER_SETUP_AVAILABLE = False

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="EZRAD API",
    description="Radiology Management System API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure router settings
if ROUTER_SETUP_AVAILABLE:
    router_config = RouterConfig()
else:
    router_config = None

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup routers
if ROUTER_SETUP_AVAILABLE:
    try:
        api_router, health_router = setup_routers()
        
        # Include the health/root routes (no prefix)
        app.include_router(health_router)
        
        # Include the main API router
        app.include_router(api_router)
        
        logger.info("Routers configured successfully")
        
    except Exception as e:
        logger.error(f"Error setting up routers: {e}")
        ROUTER_SETUP_AVAILABLE = False

if not ROUTER_SETUP_AVAILABLE:
    # Fallback to basic health check if router setup fails
    @app.get("/")
    async def fallback_root():
        return {"message": "EZRAD API is running (fallback mode)", "status": "limited"}
    
    @app.get("/health")
    async def fallback_health():
        return {"status": "unhealthy", "message": "Router setup failed"}

# Mount static files for image serving (optional)
uploads_dir = "uploads"
if os.path.exists(uploads_dir):
    app.mount("/static", StaticFiles(directory=uploads_dir), name="static")

# Add request logging middleware
@app.middleware("http")
async def log_requests(request, call_next):
    """Log all requests"""
    start_time = time.time()
    logger.info(f"Request: {request.method} {request.url}")
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    logger.info(f"Response: {response.status_code} - {process_time:.4f}s")
    
    return response

@app.on_event("startup")
async def startup_event():
    """Run on application startup"""
    logger.info("EZRAD API starting up...")
    logger.info("Available routes:")
    for route in app.routes:
        if hasattr(route, 'methods') and hasattr(route, 'path'):
            logger.info(f"  {list(route.methods)} {route.path}")

    # Start socket server in background
    try:
        asyncio.create_task(start_socket_server())
        logger.info("Socket server started in background")
    except Exception as e:
        logger.error(f"Failed to start socket server: {e}")


@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown"""
    logger.info("EZRAD API shutting down...")

@app.exception_handler(404)
async def not_found_handler(request, exc):
    """Handle 404 errors"""
    return JSONResponse(status_code=404, content={"error": "Resource not found", "path": str(request.url)})

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    """Handle 500 errors"""
    logger.error(f"Internal error: {exc}")
    return JSONResponse(status_code=500, content={"error": "Internal server error", "message": "Please try again later"})

if __name__ == "__main__":
    import uvicorn
    import time
    
    # Run the application
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Enable auto-reload for development
        log_level="info"
    )
