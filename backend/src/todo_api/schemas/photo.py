"""
Photo-related Pydantic schemas.

This module contains all Pydantic models for photo upload and management
validation, serialization, and API documentation.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, HttpUrl, ConfigDict


class TodoPhotoBase(BaseModel):
    """Base schema for todo photos with common fields."""
    
    filename: str = Field(..., description="Original filename of the uploaded photo")


class TodoPhotoCreate(TodoPhotoBase):
    """Schema for creating a new photo record."""
    
    # Inherits filename from base
    # Other fields will be set by the server
    pass


class TodoPhotoSchema(TodoPhotoBase):
    """Complete photo schema for API responses."""
    
    id: int = Field(..., description="Unique photo ID")
    url: str = Field(..., description="URL where the photo can be accessed")
    s3_key: Optional[str] = Field(None, description="S3 storage key (if using S3)")
    todo_id: int = Field(..., description="ID of the associated todo item")
    created_at: datetime = Field(..., description="When the photo was uploaded")
    
    # Use ConfigDict for Pydantic v2
    model_config = ConfigDict(from_attributes=True)


class PhotoUploadResponse(BaseModel):
    """Response schema for photo upload operations."""
    
    photo: TodoPhotoSchema = Field(..., description="The uploaded photo record")
    message: str = Field(..., description="Success message")


class PhotoUploadRequest(BaseModel):
    """Schema for photo upload request validation."""
    
    # This would be used for JSON-based uploads if needed
    # Currently using multipart/form-data with UploadFile
    pass
