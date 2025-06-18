"""
Column settings endpoints for the Todo List Xtreme API.

This module contains all HTTP endpoints related to user column configuration,
including getting, creating, updating, and resetting column settings.
"""

import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from todo_api.config.database import get_db
from todo_api.config.logging import get_logger, log_api_call, log_database_operation, log_error
from todo_api.models import User, UserColumnSettings
from todo_api.schemas.column_settings import (
    ColumnSettingsSchema,
    ColumnSettingsCreate,
    ColumnSettingsUpdate,
    DefaultColumnSettings,
    ColumnSettingsResponse
)
from todo_api.api.v1.endpoints.auth import get_current_user

router = APIRouter()
logger = get_logger("column_settings")


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
    logger.info(f"Getting column settings for user {current_user.id}")
    
    settings = db.query(UserColumnSettings).filter(
        UserColumnSettings.user_id == current_user.id
    ).first()
    
    if not settings:
        # Create default settings with the "Blocked" column
        default_settings = DefaultColumnSettings.get_default()
        
        settings = UserColumnSettings(
            user_id=current_user.id,
            columns_config=json.dumps({
                k: v.model_dump() for k, v in default_settings.columns_config.items()
            }),
            column_order=json.dumps(default_settings.column_order)
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
        logger.info(f"Created default column settings for user {current_user.id}")
    
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
    logger.info(f"Creating column settings for user {current_user.id}")
    
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
    db_settings = UserColumnSettings(
        user_id=current_user.id,
        columns_config=json.dumps(settings.columns_config),
        column_order=json.dumps(settings.column_order)
    )
    db.add(db_settings)
    db.commit()
    db.refresh(db_settings)

    logger.info(f"Created column settings for user {current_user.id}")
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
    try:
        logger.info(f"Updating column settings for user {current_user.id}")
        logger.info(f"Update data received: {settings_update}")
        
        settings = db.query(UserColumnSettings).filter(
            UserColumnSettings.user_id == current_user.id
        ).first()
        
        if not settings:
            # Create default settings if they don't exist, then update
            default_settings = DefaultColumnSettings.get_default()
            
            settings = UserColumnSettings(
                user_id=current_user.id,
                columns_config=json.dumps({
                    k: v.model_dump() for k, v in default_settings.columns_config.items()
                }),
                column_order=json.dumps(default_settings.column_order)
            )
            db.add(settings)
            db.flush()  # Flush to get the ID but don't commit yet
            logger.info(f"Created default settings before update for user {current_user.id}")
        
        # Update settings
        update_data = settings_update.model_dump(exclude_unset=True)
        logger.info(f"Update data (exclude_unset): {update_data}")
        
        if "columns_config" in update_data and update_data["columns_config"] is not None:
            logger.info(f"Updating columns_config: {update_data['columns_config']}")
            setattr(settings, "columns_config", json.dumps({
                k: v.model_dump() if hasattr(v, 'model_dump') else v
                for k, v in update_data["columns_config"].items()
            }))
        
        if "column_order" in update_data and update_data["column_order"] is not None:
            logger.info(f"Updating column_order: {update_data['column_order']}")
            setattr(settings, "column_order", json.dumps(update_data["column_order"]))
        
        db.commit()
        db.refresh(settings)
        logger.info(f"Updated column settings for user {current_user.id}")
        return settings
        
    except Exception as e:
        logger.error(f"Error updating column settings for user {current_user.id}: {str(e)}")
        logger.error(f"Exception type: {type(e)}")
        db.rollback()
        from pydantic import ValidationError
        if isinstance(e, ValidationError):
            logger.error(f"Validation errors: {e.errors()}")
        raise


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
    logger.info(f"Resetting column settings for user {current_user.id}")
    
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
            k: v.model_dump() for k, v in default_settings.columns_config.items()
        }),
        column_order=json.dumps(default_settings.column_order)
    )
    
    db.add(new_settings)
    db.commit()
    db.refresh(new_settings)
    logger.info(f"Reset column settings for user {current_user.id}")
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
            k: v.model_dump() for k, v in default_settings.columns_config.items()
        }
    }
