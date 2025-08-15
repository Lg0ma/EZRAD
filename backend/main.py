"""
Main FastAPI application for EZRAD
This file sets up the FastAPI app with the router configuration and manages
the concurrent TCP socket server using the lifespan context manager.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import os
import logging
import time
import asyncio
from dotenv import load_dotenv
#load environment variables
load_dotenv()

# Import the TCP server start function
# Assuming your socket server file is at routes/socket_server.py

from routes.socket_server import start_server as start_socket_server



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

# --- Lifespan Management for Concurrent Servers ---
tcp_server_task = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manages the startup and shutdown of the application, including background tasks.
    """
    global tcp_server_task
    logger.info("EZRAD API starting up...")
    
    # Start the TCP socket server as a background task
    try:
        loop = asyncio.get_running_loop()
        tcp_server_task = loop.create_task(start_socket_server())
        logger.info("TCP socket server task created and started in the background.")
    except Exception as e:
        logger.error(f"Failed to start TCP socket server: {e}")

    yield  # The application is now running and handling requests

    # --- Shutdown logic ---
    logger.info("EZRAD API shutting down...")
    if tcp_server_task and not tcp_server_task.done():
        logger.info("Stopping TCP server...")
        tcp_server_task.cancel()
        try:
            await tcp_server_task
        except asyncio.CancelledError:
            logger.info("TCP server task has been successfully cancelled.")


# --- FastAPI App Initialization ---
# Create FastAPI app and attach the lifespan manager
app = FastAPI(
    title="EZRAD API",
    description="Radiology Management System API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
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

# Custom Exception Handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    """Handle 404 errors"""
    return JSONResponse(status_code=404, content={"error": "Resource not found", "path": str(request.url)})

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    """Handle 500 errors"""
    logger.error(f"Internal error: {exc}")
    return JSONResponse(status_code=500, content={"error": "Internal server error", "message": "Please try again later"})

# Main execution block
if __name__ == "__main__":
    import uvicorn
    
    # Run the application using uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Enable auto-reload for development
        log_level="info"
    )
