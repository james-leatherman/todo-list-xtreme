from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import User, UserColumnSettings
from app.schemas import ColumnSettings, ColumnSettingsCreate, ColumnSettingsUpdate

router = APIRouter()


@router.get("/", response_model=ColumnSettings)
def get_column_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get column settings for current user"""
    settings = db.query(UserColumnSettings).filter(UserColumnSettings.user_id == current_user.id).first()
    if not settings:
        # If settings don't exist, create default ones
        settings = UserColumnSettings(user_id=current_user.id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


@router.post("/", response_model=ColumnSettings, status_code=status.HTTP_201_CREATED)
def create_column_settings(
    settings: ColumnSettingsCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create column settings for current user"""
    # Check if settings already exist
    existing_settings = db.query(UserColumnSettings).filter(UserColumnSettings.user_id == current_user.id).first()
    if existing_settings:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Column settings already exist for this user"
        )
    
    # Validate JSON strings
    settings_dict = settings.dict()
    import json
    
    for key in ['columns_config', 'column_order']:
        if key in settings_dict and settings_dict[key]:
            try:
                # Try parsing JSON to validate it
                json.loads(settings_dict[key])
            except json.JSONDecodeError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid JSON in {key}"
                )
    
    # Create new settings
    db_settings = UserColumnSettings(**settings_dict, user_id=current_user.id)
    db.add(db_settings)
    db.commit()
    db.refresh(db_settings)
    return db_settings


@router.put("/", response_model=ColumnSettings)
def update_column_settings(
    settings: ColumnSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update column settings for current user"""
    db_settings = db.query(UserColumnSettings).filter(UserColumnSettings.user_id == current_user.id).first()
    if not db_settings:
        # If settings don't exist, create them
        db_settings = UserColumnSettings(user_id=current_user.id)
        db.add(db_settings)
    
    # Update settings
    for key, value in settings.dict(exclude_unset=True).items():
        # Validate JSON strings if they're being set
        if key == 'columns_config' or key == 'column_order':
            if value:
                try:
                    # Try parsing JSON to validate it
                    import json
                    json.loads(value)
                except json.JSONDecodeError:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Invalid JSON in {key}"
                    )
        
        setattr(db_settings, key, value)
    
    db.commit()
    db.refresh(db_settings)
    return db_settings
