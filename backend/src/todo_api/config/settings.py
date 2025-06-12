"""
Application settings and configuration management.

This module handles all configuration settings for the Todo List Xtreme API,
including database connections, authentication, AWS services, and monitoring.
"""

import os
from functools import lru_cache
from typing import List, Optional

from pydantic_settings import BaseSettings

from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Settings(BaseSettings):
    """Application settings with validation and type hints."""
    
    # API settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Todo List Xtreme API"
    VERSION: str = "1.4.0"
    DESCRIPTION: str = "A full-stack to-do list application with comprehensive observability"
    
    # CORS settings - simplified to avoid parsing issues
    CORS_ORIGINS_STR: str = "http://localhost:3000"
    
    @property
    def CORS_ORIGINS(self) -> List[str]:
        """Parse CORS origins from string."""
        return [origin.strip() for origin in self.CORS_ORIGINS_STR.split(",")]
    
    # Database settings
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: str = "5432"
    POSTGRES_DB: str = "todolist"
    
    # Computed database URL
    @property
    def DATABASE_URL(self) -> str:
        """Construct database URL from components."""
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )
    
    # JWT settings
    SECRET_KEY: str = "supersecretkey"  # Should be overridden in production
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # AWS S3 settings for photo storage
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "us-east-1"
    AWS_S3_BUCKET: str = "todo-list-xtreme"
    
    # Google OAuth settings
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/auth/google/callback"
    FRONTEND_URL: str = "http://localhost:3000"
    
    # Monitoring and observability
    OTEL_EXPORTER_OTLP_ENDPOINT: str = "http://localhost:4317"
    OTEL_RESOURCE_ATTRIBUTES: str = "service.name=todo-list-xtreme-api"
    ENABLE_METRICS: bool = True
    ENABLE_TRACING: bool = True
    
    # Development settings
    DEBUG: bool = False
    TESTING: bool = False
    
    # File upload settings
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: List[str] = [".jpg", ".jpeg", ".png", ".gif"]
    UPLOAD_DIR: str = "uploads"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.
    
    Using lru_cache ensures we create the settings object only once,
    which improves performance and ensures consistency.
    """
    return Settings()


# Global settings instance
settings = get_settings()


# Export commonly used settings for backward compatibility
API_V1_STR = settings.API_V1_STR
PROJECT_NAME = settings.PROJECT_NAME
DATABASE_URL = settings.DATABASE_URL
