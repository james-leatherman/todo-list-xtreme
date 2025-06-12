"""
User-related Pydantic schemas.

This module contains all Pydantic models for user management,
authentication, and profile validation.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, EmailStr, ConfigDict


class UserBase(BaseModel):
    """Base schema for users with common fields."""
    
    email: EmailStr = Field(..., description="User's email address")
    name: Optional[str] = Field(None, max_length=100, description="User's display name")


class UserCreate(UserBase):
    """Schema for creating a new user."""
    
    google_id: Optional[str] = Field(None, description="Google OAuth ID")
    is_active: bool = Field(True, description="Whether the user account is active")


class UserUpdate(BaseModel):
    """Schema for updating user information."""
    
    name: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = None


class UserSchema(UserBase):
    """Complete user schema for API responses."""
    
    id: int = Field(..., description="Unique user ID")
    google_id: Optional[str] = Field(None, description="Google OAuth ID")
    is_active: bool = Field(..., description="Whether the user account is active")
    created_at: datetime = Field(..., description="When the user was created")
    updated_at: Optional[datetime] = Field(None, description="When the user was last updated")
    
    # Use ConfigDict for Pydantic v2
    model_config = ConfigDict(from_attributes=True)


class UserProfile(UserSchema):
    """Extended user profile with additional information."""
    
    todo_count: int = Field(0, description="Total number of todos")
    completed_todo_count: int = Field(0, description="Number of completed todos")


class AuthToken(BaseModel):
    """Schema for authentication token response."""
    
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field("bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiration time in seconds")


class GoogleAuthRequest(BaseModel):
    """Schema for Google OAuth authentication request."""
    
    code: str = Field(..., description="Google OAuth authorization code")
    state: Optional[str] = Field(None, description="OAuth state parameter")
