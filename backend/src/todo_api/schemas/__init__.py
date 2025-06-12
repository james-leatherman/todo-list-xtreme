"""
Pydantic schemas package.

This package contains all Pydantic models for request/response validation,
serialization, and API documentation.
"""

from .todo import TodoBase, TodoCreate, TodoUpdate, TodoSchema, TodoSummary, TodoListResponse
from .photo import TodoPhotoBase, TodoPhotoCreate, TodoPhotoSchema, PhotoUploadResponse
from .user import UserBase, UserCreate, UserSchema, UserUpdate
from .column_settings import ColumnSettingsBase, ColumnSettingsCreate, ColumnSettingsUpdate, ColumnSettingsSchema

# Export all schemas for easy importing
__all__ = [
    # Todo schemas
    "TodoBase",
    "TodoCreate", 
    "TodoUpdate",
    "TodoSchema",
    "TodoSummary",
    "TodoListResponse",
    # Photo schemas
    "TodoPhotoBase",
    "TodoPhotoCreate",
    "TodoPhotoSchema", 
    "PhotoUploadResponse",
    # User schemas
    "UserBase",
    "UserCreate",
    "UserSchema",
    "UserUpdate",
    # Column settings schemas
    "ColumnSettingsBase",
    "ColumnSettingsCreate",
    "ColumnSettingsUpdate", 
    "ColumnSettingsSchema",
]
