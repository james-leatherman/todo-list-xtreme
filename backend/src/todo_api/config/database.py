"""
Database configuration and session management.

This module handles SQLAlchemy database setup, connection pooling,
and provides database session dependencies for the API.
"""

import logging
from functools import lru_cache
from typing import Generator

from sqlalchemy import create_engine, event, text
from sqlalchemy.engine import Engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import QueuePool

from .settings import get_settings

# Import metrics setup - handle gracefully if not available
try:
    from ..monitoring.metrics import setup_database_metrics
    _metrics_available = True
except ImportError:
    _metrics_available = False
    def setup_database_metrics(engine):
        pass  # No-op if metrics not available

logger = logging.getLogger(__name__)

# Create base class for SQLAlchemy models
Base = declarative_base()


@lru_cache()
def get_database_engine() -> Engine:
    """
    Create and configure database engine with connection pooling.
    
    Returns:
        SQLAlchemy Engine instance with proper configuration
    """
    settings = get_settings()
    
    engine = create_engine(
        settings.DATABASE_URL,
        poolclass=QueuePool,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,  # Verify connections before use
        pool_recycle=3600,   # Recycle connections after 1 hour
        echo=settings.DEBUG,  # Log SQL queries in debug mode
    )
    
    # Set up database metrics monitoring
    if _metrics_available:
        setup_database_metrics(engine)
    
    # Add connection event listeners
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        """Set database-specific connection parameters."""
        if "sqlite" in settings.DATABASE_URL:
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()
    
    logger.info(f"Database engine created for: {settings.POSTGRES_SERVER}")
    return engine


# Create session factory
engine = get_database_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """
    Database session dependency for FastAPI.
    
    Yields:
        SQLAlchemy database session
        
    Usage:
        @app.get("/")
        def endpoint(db: Session = Depends(get_db)):
            # Use db session here
            pass
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def create_tables():
    """Create all database tables."""
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")


def drop_tables():
    """Drop all database tables. Use with caution!"""
    logger.warning("Dropping all database tables...")
    Base.metadata.drop_all(bind=engine)
    logger.warning("All database tables dropped")


def check_database_connection() -> bool:
    """
    Check if database connection is working.
    
    Returns:
        True if connection is successful, False otherwise
    """
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        logger.info("Database connection check: SUCCESS")
        return True
    except Exception as e:
        logger.error(f"Database connection check: FAILED - {e}")
        return False
