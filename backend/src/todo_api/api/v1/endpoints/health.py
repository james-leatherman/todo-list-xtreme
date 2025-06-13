"""
Health check endpoints for the Todo List Xtreme API.

This module contains endpoints for monitoring application health,
database connectivity, and system status.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

# Import from new structure with fallback to old
try:
    from todo_api.config.database import get_db, check_database_connection
    from todo_api.config.settings import get_settings
    from todo_api.models import User
    from todo_api.monitoring.metrics import get_current_db_metrics
except ImportError:
    # Fallback to old structure during transition
    from todo_api.config.database import get_db
    from app.config import settings as app_settings
    from app.models import User
    get_settings = lambda: app_settings
    check_database_connection = None
    get_current_db_metrics = lambda: {}

router = APIRouter()


@router.get("/")
def health_check():
    """
    Basic health check endpoint.
    
    Returns:
        Application health status
    """
    settings = get_settings()
    return {
        "status": "healthy",
        "service": "todo-list-xtreme-api",
        "version": getattr(settings, 'VERSION', '1.4.0'),
        "message": "Service is running normally"
    }


@router.get("/detailed")
def detailed_health_check(db: Session = Depends(get_db)):
    """
    Detailed health check with database connectivity.
    
    Args:
        db: Database session
        
    Returns:
        Detailed health information including database status
    """
    settings = get_settings()
    health_info = {
        "status": "healthy",
        "service": "todo-list-xtreme-api", 
        "version": getattr(settings, 'VERSION', '1.4.0'),
        "timestamp": None,
        "checks": {
            "database": "unknown",
            "metrics": "unknown"
        }
    }
    
    # Check database connectivity
    try:
        user_count = db.query(User).count()
        health_info["checks"]["database"] = {
            "status": "healthy",
            "user_count": user_count,
            "message": "Database connection successful"
        }
    except Exception as e:
        health_info["status"] = "unhealthy"
        health_info["checks"]["database"] = {
            "status": "unhealthy",
            "error": str(e),
            "message": "Database connection failed"
        }
    
    # Check metrics system
    try:
        if get_current_db_metrics:
            metrics = get_current_db_metrics()
            health_info["checks"]["metrics"] = {
                "status": "healthy",
                "data": metrics,
                "message": "Metrics system operational"
            }
        else:
            health_info["checks"]["metrics"] = {
                "status": "unavailable",
                "message": "Metrics system not configured"
            }
    except Exception as e:
        health_info["checks"]["metrics"] = {
            "status": "error",
            "error": str(e),
            "message": "Metrics system error"
        }
    
    return health_info


@router.get("/database")
def database_health_check(db: Session = Depends(get_db)):
    """
    Database-specific health check.
    
    Args:
        db: Database session
        
    Returns:
        Database health and connection information
    """
    try:
        # Test basic query
        user_count = db.query(User).count()
        
        # Get database metrics if available
        metrics = {}
        if get_current_db_metrics:
            try:
                metrics = get_current_db_metrics()
            except Exception:
                pass
        
        return {
            "status": "healthy",
            "connection": "active",
            "user_count": user_count,
            "metrics": metrics,
            "message": "Database is operational"
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "connection": "failed",
            "error": str(e),
            "message": "Database connection failed"
        }


@router.get("/readiness")
def readiness_check(db: Session = Depends(get_db)):
    """
    Kubernetes readiness probe endpoint.
    
    Args:
        db: Database session
        
    Returns:
        Readiness status (200 if ready, 503 if not ready)
    """
    try:
        # Test database connection
        db.query(User).count()
        return {"status": "ready", "message": "Service is ready to accept traffic"}
    except Exception:
        # Return 503 status for not ready
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service not ready - database connection failed"
        )


@router.get("/liveness")
def liveness_check():
    """
    Kubernetes liveness probe endpoint.
    
    Returns:
        Liveness status (always 200 unless process is dead)
    """
    return {"status": "alive", "message": "Service is alive"}
