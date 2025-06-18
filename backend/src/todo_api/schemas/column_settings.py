"""
Column settings-related Pydantic schemas.

This module contains all Pydantic models for column configuration
validation, serialization, and API documentation.
"""

import json
from typing import Dict, List, Any, Optional

from pydantic import BaseModel, Field, ConfigDict, field_validator, field_serializer


class ColumnConfig(BaseModel):
    """Schema for individual column configuration."""
    
    id: str = Field(..., description="Unique column identifier")
    title: str = Field(..., description="Display title of the column")
    taskIds: List[int] = Field(default_factory=list, description="List of task IDs in this column")


class ColumnSettingsBase(BaseModel):
    """Base schema for column settings with common fields."""
    
    column_order: List[str] = Field(
        default=["todo", "inProgress", "blocked", "done"],
        description="Order of columns"
    )
    columns_config: Dict[str, ColumnConfig] = Field(
        ...,
        description="Configuration for each column"
    )


class ColumnSettingsCreate(ColumnSettingsBase):
    """Schema for creating new column settings."""
    
    # Inherits all fields from base
    pass
    
    @field_validator('column_order', mode='before')
    @classmethod
    def parse_column_order_create(cls, v):
        """Parse column_order from JSON string if needed."""
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return ["todo", "inProgress", "blocked", "done"]  # Default
        return v or ["todo", "inProgress", "blocked", "done"]
    
    @field_validator('columns_config', mode='before')
    @classmethod
    def parse_columns_config_create(cls, v):
        """Parse columns_config from JSON string if needed."""
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                # Convert dict values to ColumnConfig objects if they're raw dicts
                if isinstance(parsed, dict):
                    result = {}
                    for key, value in parsed.items():
                        if isinstance(value, dict):
                            result[key] = ColumnConfig(**value)
                        else:
                            result[key] = value
                    return result
                return parsed
            except (json.JSONDecodeError, TypeError):
                # Return default if parsing fails
                return {
                    "todo": ColumnConfig(id="todo", title="To Do", taskIds=[]),
                    "inProgress": ColumnConfig(id="inProgress", title="In Progress", taskIds=[]),
                    "blocked": ColumnConfig(id="blocked", title="Blocked", taskIds=[]),
                    "done": ColumnConfig(id="done", title="Completed", taskIds=[])
                }
        return v


class ColumnSettingsUpdate(BaseModel):
    """Schema for updating column settings."""
    
    column_order: Optional[List[str]] = Field(None, description="New order of columns")
    columns_config: Optional[Dict[str, ColumnConfig]] = Field(
        None,
        description="Updated configuration for columns"
    )
    
    @field_validator('column_order', mode='before')
    @classmethod
    def parse_column_order_update(cls, v):
        """Parse column_order from JSON string if needed."""
        if v is None:
            return v
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return []
        return v
    
    @field_validator('columns_config', mode='before')
    @classmethod
    def parse_columns_config_update(cls, v):
        """Parse columns_config from JSON string if needed."""
        if v is None:
            return v
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                # Convert dict values to ColumnConfig objects if they're raw dicts
                if isinstance(parsed, dict):
                    result = {}
                    for key, value in parsed.items():
                        if isinstance(value, dict):
                            result[key] = ColumnConfig(**value)
                        else:
                            result[key] = value
                    return result
                return parsed
            except (json.JSONDecodeError, TypeError):
                return {}
        return v


class ColumnSettingsSchema(ColumnSettingsBase):
    """Complete column settings schema for API responses."""
    
    id: int = Field(..., description="Unique settings ID")
    user_id: int = Field(..., description="ID of the user who owns these settings")
    
    # Use ConfigDict for Pydantic v2
    model_config = ConfigDict(from_attributes=True)
    
    @field_validator('column_order', mode='before')
    @classmethod
    def parse_column_order(cls, v):
        """Parse column_order from JSON string if needed."""
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return []
        return v or []
    
    @field_validator('columns_config', mode='before')
    @classmethod
    def parse_columns_config(cls, v):
        """Parse columns_config from JSON string if needed."""
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                # Convert dict values to ColumnConfig objects if they're raw dicts
                if isinstance(parsed, dict):
                    result = {}
                    for key, value in parsed.items():
                        if isinstance(value, dict):
                            result[key] = ColumnConfig(**value)
                        else:
                            result[key] = value
                    return result
                return parsed
            except (json.JSONDecodeError, TypeError):
                return {}
        return v or {}


class DefaultColumnSettings(ColumnSettingsBase):
    """Schema for default column configuration."""
    
    @classmethod
    def get_default(cls) -> "DefaultColumnSettings":
        """Get the default column configuration with the Blocked column."""
        return cls(
            column_order=["todo", "inProgress", "blocked", "done"],
            columns_config={
                "todo": ColumnConfig(
                    id="todo",
                    title="To Do",
                    taskIds=[]
                ),
                "inProgress": ColumnConfig(
                    id="inProgress", 
                    title="In Progress",
                    taskIds=[]
                ),
                "blocked": ColumnConfig(
                    id="blocked",
                    title="Blocked", 
                    taskIds=[]
                ),
                "done": ColumnConfig(
                    id="done",
                    title="Completed",
                    taskIds=[]
                )
            }
        )


class ColumnSettingsResponse(BaseModel):
    """Response schema for column settings operations."""
    
    settings: ColumnSettingsSchema = Field(..., description="Column settings")
    message: str = Field(..., description="Operation result message")
