"""
Column settings endpoints for the Todo List Xtreme API.

This module contains all HTTP endpoints related to user column configuration,
including getting, creating, updating, and resetting column settings.
"""

import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

# Import from new structure with fallback to old
try:
    from todo_api.config.database import get_db
    from todo_api.models import User, UserColumnSettings
    from todo_api.schemas.column_settings import (
        ColumnSettingsSchema,
        ColumnSettingsCreate,
        ColumnSettingsUpdate,
        DefaultColumnSettings,
        ColumnSettingsResponse
    )
    from todo_api.core.auth import get_current_user
except ImportError:
    # Fallback to old structure during transition
    from app.auth import get_current_user
    from todo_api.config.database import get_db
    from app.models import User, UserColumnSettings
    from app.schemas import ColumnSettings as ColumnSettingsSchema
    from app.schemas import ColumnSettingsCreate, ColumnSettingsUpdate

router = APIRouter()


@router.get("/", response_model=ColumnSettingsSchema)
def get_column_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get column settings for the current user.
    
    If no settings exist, creates and returns default settings including
    the "Blocked" column.
    
    Args:
        db: Database session
        current_user: Authenticated user
        
    Returns:
        User's column settings or newly created default settings
    """
    settings = db.query(UserColumnSettings).filter(
        UserColumnSettings.user_id == current_user.id
    ).first()
    
    if not settings:
        # Create default settings with the "Blocked" column
        default_settings = DefaultColumnSettings.get_default()
        
        settings = UserColumnSettings(
            user_id=current_user.id,
            columns_config=json.dumps({
                k: v.dict() for k, v in default_settings.columns_config.items()
            }),
            column_order=json.dumps(default_settings.column_order)
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
    
    return settings


@router.post("/", response_model=ColumnSettingsSchema, status_code=status.HTTP_201_CREATED)
def create_column_settings(
    settings: ColumnSettingsCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create column settings for the current user.
    
    Args:
        settings: Column settings to create
        db: Database session
        current_user: Authenticated user
        
    Returns:
        Created column settings
        
    Raises:
        HTTPException: If settings already exist for the user
    """
    # Check if settings already exist
    existing_settings = db.query(UserColumnSettings).filter(
        UserColumnSettings.user_id == current_user.id
    ).first()
    
    if existing_settings:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Column settings already exist for this user. Use PUT to update."
        )
    
    # Create new settings
    if settings.columns_config:
        if isinstance(settings.columns_config, str):
            columns_config_dict = json.loads(settings.columns_config)
        else:
            columns_config_dict = settings.columns_config
    else:
        columns_config_dict = {}

    db_settings = UserColumnSettings(
        user_id=current_user.id,
        columns_config=json.dumps({
            k: v.dict() if hasattr(v, 'dict') else v for k, v in columns_config_dict.items()
        }),
        column_order=json.dumps(settings.column_order)
    )
    
    db.add(db_settings)
    db.commit()
    db.refresh(db_settings)
    return db_settings


@router.put("/", response_model=ColumnSettingsSchema)
def update_column_settings(
    settings_update: ColumnSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update column settings for the current user.
    
    Args:
        settings_update: Updated column settings
        db: Database session
        current_user: Authenticated user
        
    Returns:
        Updated column settings
        
    Raises:
        HTTPException: If settings don't exist for the user
    """
    settings = db.query(UserColumnSettings).filter(
        UserColumnSettings.user_id == current_user.id
    ).first()
    
    if not settings:
        # Create default settings if they don't exist, then update
        default_settings = DefaultColumnSettings.get_default()
        
        settings = UserColumnSettings(
            user_id=current_user.id,
            columns_config=json.dumps({
                k: v.dict() for k, v in default_settings.columns_config.items()
            }),
            column_order=json.dumps(default_settings.column_order)
        )
        db.add(settings)
        db.flush()  # Flush to get the ID but don't commit yet
    
    # Update settings
    update_data = settings_update.dict(exclude_unset=True)
    
    if "columns_config" in update_data:
        setattr(settings, "columns_config", json.dumps({
            k: v.dict() if hasattr(v, 'dict') else v
            for k, v in update_data["columns_config"].items()
        }))
    
    if "column_order" in update_data:
        settings.column_order = update_data["column_order"]
    
    db.commit()
    db.refresh(settings)
    return settings


@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
def delete_column_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete column settings for the current user.
    
    This will reset the user to default column settings on next access.
    
    Args:
        db: Database session
        current_user: Authenticated user
        
    Raises:
        HTTPException: If settings don't exist for the user
    """
    settings = db.query(UserColumnSettings).filter(
        UserColumnSettings.user_id == current_user.id
    ).first()
    
    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Column settings not found"
        )
    
    db.delete(settings)
    db.commit()


@router.post("/reset", response_model=ColumnSettingsSchema)
def reset_column_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Reset column settings to default configuration including "Blocked" column.
    
    Args:
        db: Database session
        current_user: Authenticated user
        
    Returns:
        Reset column settings with default configuration
    """
    # Delete existing settings if they exist
    existing_settings = db.query(UserColumnSettings).filter(
        UserColumnSettings.user_id == current_user.id
    ).first()
    
    if existing_settings:
        db.delete(existing_settings)
        db.flush()
    
    # Create new default settings
    default_settings = DefaultColumnSettings.get_default()
    
    new_settings = UserColumnSettings(
        user_id=current_user.id,
        columns_config=json.dumps({
            k: v.dict() for k, v in default_settings.columns_config.items()
        }),
        column_order=json.dumps(default_settings.column_order)
    )
    
    db.add(new_settings)
    db.commit()
    db.refresh(new_settings)
    return new_settings


@router.get("/default", response_model=dict)
def get_default_column_settings():
    """
    Get the default column configuration.
    
    Returns:
        Default column settings including the "Blocked" column
    """
    default_settings = DefaultColumnSettings.get_default()
    return {
        "column_order": default_settings.column_order,
        "columns_config": {
            k: v.dict() for k, v in default_settings.columns_config.items()
        }
    }
