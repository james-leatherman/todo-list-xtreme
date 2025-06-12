"""
Todo-related Pydantic schemas.

This module contains all Pydantic models for todo item validation,
serialization, and API documentation.
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, ConfigDict


class TodoBase(BaseModel):
    """Base schema for todo items with common fields."""
    
    title: str = Field(..., min_length=1, max_length=200, description="Todo item title")
    description: Optional[str] = Field(None, max_length=1000, description="Todo item description")
    is_completed: bool = Field(False, description="Whether the todo is completed")
    status: str = Field("todo", description="Current status/column (todo, inProgress, blocked, done)")


class TodoCreate(TodoBase):
    """Schema for creating a new todo item."""
    
    # All fields inherited from TodoBase
    # status defaults to "todo" for new items
    pass


class TodoUpdate(BaseModel):
    """Schema for updating an existing todo item."""
    
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    is_completed: Optional[bool] = None
    status: Optional[str] = Field(None, pattern="^(todo|inProgress|blocked|done)$")


class TodoSchema(TodoBase):
    """Complete todo schema for API responses."""
    
    id: int = Field(..., description="Unique todo item ID")
    user_id: int = Field(..., description="ID of the user who owns this todo")
    created_at: datetime = Field(..., description="When the todo was created")
    updated_at: Optional[datetime] = Field(None, description="When the todo was last updated")
    
    # Use ConfigDict for Pydantic v2
    model_config = ConfigDict(from_attributes=True)


class TodoSummary(BaseModel):
    """Summary schema for todo statistics."""
    
    total: int = Field(..., description="Total number of todos")
    todo: int = Field(..., description="Number of todos in 'todo' status")
    in_progress: int = Field(..., description="Number of todos in 'inProgress' status") 
    blocked: int = Field(..., description="Number of todos in 'blocked' status")
    done: int = Field(..., description="Number of completed todos")


class TodoListResponse(BaseModel):
    """Response schema for todo list endpoints."""
    
    todos: List[TodoSchema] = Field(..., description="List of todo items")
    total_count: int = Field(..., description="Total number of todos for the user")
    summary: TodoSummary = Field(..., description="Todo statistics summary")
