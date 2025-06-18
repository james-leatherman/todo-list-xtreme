"""
Todo List Xtreme API - Main Application Entry Point

This module creates and configures the FastAPI application with all necessary
middleware, routers, and observability components.
"""

import os
import logging
from contextlib import asynccontextmanager
import sys
from pathlib import Path

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from prometheus_fastapi_instrumentator import Instrumentator

# OpenTelemetry imports
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry import trace

from .config.settings import settings
from .config.database import get_db, engine, check_database_connection, create_tables
from .config.logging import setup_logging, RequestResponseLoggingMiddleware, get_logger
from .monitoring.metrics import setup_database_metrics
from .models import User
from .api.v1.router import api_router

# Update sys.path logic to include `src` explicitly
sys.path.append(str(Path(__file__).resolve().parent.parent.parent))

# Setup comprehensive logging
log_file = getattr(settings, 'LOG_FILE', None)
setup_logging(
    log_level=getattr(settings, 'LOG_LEVEL', 'INFO'),
    log_format=getattr(settings, 'LOG_FORMAT', 'json'),
    log_file=log_file if log_file else None
)
logger = get_logger("main")


def setup_opentelemetry() -> None:
    """Configure OpenTelemetry tracing."""
    if not settings.ENABLE_TRACING:
        logger.info("OpenTelemetry tracing disabled")
        return
    
    try:
        resource = Resource.create({
            "service.name": "todo-list-xtreme-api",
            "service.version": settings.VERSION,
        })
        provider = TracerProvider(resource=resource)
        
        otlp_exporter = OTLPSpanExporter(
            endpoint=f"{settings.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces"
        )
        span_processor = BatchSpanProcessor(otlp_exporter)
        provider.add_span_processor(span_processor)
        trace.set_tracer_provider(provider)
        
        logger.info("OpenTelemetry tracing configured successfully")
    except Exception as e:
        logger.error(f"Failed to configure OpenTelemetry: {e}")


def setup_metrics(app: FastAPI) -> None:
    """Configure Prometheus metrics."""
    if not settings.ENABLE_METRICS:
        logger.info("Prometheus metrics disabled")
        return
    
    try:
        # Set up FastAPI metrics
        Instrumentator().instrument(app).expose(
            app, 
            endpoint="/metrics", 
            include_in_schema=False
        )
        
        # Set up database metrics
        setup_database_metrics(engine)
        
        logger.info("Prometheus metrics configured successfully")
    except Exception as e:
        logger.error(f"Failed to configure metrics: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management."""
    # Startup
    logger.info("Starting Todo List Xtreme API...")
    
    # Check database connection
    if not check_database_connection():
        logger.error("Database connection failed!")
        raise RuntimeError("Database connection failed")
    
    # Create database tables if they don't exist
    if not settings.TESTING:
        create_tables()
    
    logger.info("Todo List Xtreme API started successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Todo List Xtreme API...")


def create_application() -> FastAPI:
    """Create and configure the FastAPI application."""
    
    # Create FastAPI app
    app = FastAPI(
        title=settings.PROJECT_NAME,
        description=settings.DESCRIPTION,
        version=settings.VERSION,
        openapi_url=f"{settings.API_V1_STR}/openapi.json" if not settings.TESTING else None,
        docs_url="/docs" if not settings.TESTING else None,
        redoc_url="/redoc" if not settings.TESTING else None,
        lifespan=lifespan,
    )
    
    # Set up OpenTelemetry
    setup_opentelemetry()
    
    # Instrument FastAPI with OpenTelemetry
    if settings.ENABLE_TRACING:
        FastAPIInstrumentor.instrument_app(app)
        RequestsInstrumentor().instrument()
    
    # Set up metrics
    setup_metrics(app)
    
    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Add request/response logging middleware
    app.add_middleware(RequestResponseLoggingMiddleware)
    
    # Include API routers
    app.include_router(api_router, prefix=settings.API_V1_STR)
    
    # Mount static files for uploads
    if not os.path.exists(settings.UPLOAD_DIR):
        os.makedirs(settings.UPLOAD_DIR)

    if not settings.TESTING:
        app.mount("/backend/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
    
    # Add basic endpoints
    @app.get("/")
    async def root():
        """Root endpoint."""
        return {
            "message": "Welcome to Todo List Xtreme API",
            "version": settings.VERSION,
            "docs": "/docs",
        }
    
    @app.get("/health")
    async def health_check(db: Session = Depends(get_db)):
        """Health check endpoint."""
        try:
            # Test database connection
            user_count = db.query(User).count()
            return {
                "status": "healthy",
                "version": settings.VERSION,
                "database": "connected",
                "user_count": user_count,
            }
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return JSONResponse(
                status_code=503,
                content={
                    "status": "unhealthy",
                    "version": settings.VERSION,
                    "database": "disconnected",
                    "error": str(e),
                }
            )
    
    # Add Google OAuth callback route (outside API prefix for Google OAuth compatibility)
    @app.get("/auth/google/callback")
    async def google_callback_redirect(code: str, db: Session = Depends(get_db)):
        """Redirect Google OAuth callback to the proper API endpoint."""
        from .api.v1.endpoints.auth import google_callback
        return await google_callback(code, db)
    
    return app


# Create the FastAPI application
app = create_application()


def main() -> None:
    """Main entry point for running the application."""
    import uvicorn
    
    uvicorn.run(
        "todo_api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info" if not settings.DEBUG else "debug",
    )


if __name__ == "__main__":
    main()
