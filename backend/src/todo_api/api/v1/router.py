"""
API v1 router configuration.

This module sets up the main API router for version 1 of the Todo List Xtreme API,
including all endpoint collections and their configurations.
"""

from fastapi import APIRouter

from .endpoints import auth, todos, column_settings, health

# Create the main API router for version 1
api_router = APIRouter()

# Include all endpoint routers with proper prefixes and tags
api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["authentication"],
)

api_router.include_router(
    todos.router,
    prefix="/todos", 
    tags=["todos"],
)

api_router.include_router(
    column_settings.router,
    prefix="/column-settings",
    tags=["column-settings"],
)

api_router.include_router(
    health.router,
    prefix="/health",
    tags=["health"],
)

# For now, add a basic endpoint to test the structure
@api_router.get("/status")
async def api_status():
    """API status endpoint."""
    return {
        "api_version": "v1",
        "status": "active",
        "message": "Todo List Xtreme API v1 is running"
    }
