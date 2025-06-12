"""
Todo endpoints for the Todo List Xtreme API.

This module contains all HTTP endpoints related to todo item management,
including CRUD operations, photo uploads, and bulk operations.
"""

import os
import uuid
from typing import List, Optional

import boto3
from botocore.exceptions import ClientError
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

# Import from old structure during transition
from app.auth import get_current_user
from app.database import get_db
from app.models import User, Todo, TodoPhoto, UserColumnSettings
from app.schemas import Todo as TodoSchema, TodoCreate, TodoUpdate, TodoPhoto as TodoPhotoSchema
from app.config import settings

router = APIRouter()


def get_s3_client():
    """Get configured S3 client or None if not available."""
    if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
        return boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION
        )
    return None


def ensure_upload_directory():
    """Ensure the upload directory exists."""
    upload_dir = getattr(settings, 'UPLOAD_DIR', 'uploads')
    os.makedirs(upload_dir, exist_ok=True)
    return upload_dir


@router.get("/", response_model=List[TodoSchema])
def get_todos(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get todos for the current user.
    
    Args:
        skip: Number of records to skip (pagination)
        limit: Maximum number of records to return
        status: Filter by todo status (todo, inProgress, blocked, done)
        db: Database session
        current_user: Authenticated user
        
    Returns:
        List of todo items for the current user
    """
    query = db.query(Todo).filter(Todo.user_id == current_user.id)
    
    if status:
        query = query.filter(Todo.status == status)
    
    todos = query.offset(skip).limit(limit).all()
    return todos


@router.post("/", response_model=TodoSchema, status_code=status.HTTP_201_CREATED)
def create_todo(
    todo: TodoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new todo item.
    
    Args:
        todo: Todo creation data
        db: Database session
        current_user: Authenticated user
        
    Returns:
        Created todo item
    """
    db_todo = Todo(**todo.dict(), user_id=current_user.id)
    db.add(db_todo)
    db.commit()
    db.refresh(db_todo)
    return db_todo


@router.get("/{todo_id}", response_model=TodoSchema)
def get_todo(
    todo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific todo item.
    
    Args:
        todo_id: ID of the todo item
        db: Database session
        current_user: Authenticated user
        
    Returns:
        Todo item
        
    Raises:
        HTTPException: If todo not found or access denied
    """
    todo = db.query(Todo).filter(
        Todo.id == todo_id,
        Todo.user_id == current_user.id
    ).first()
    
    if not todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found"
        )
    
    return todo


@router.put("/{todo_id}", response_model=TodoSchema)
def update_todo(
    todo_id: int,
    todo_update: TodoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a todo item.
    
    Args:
        todo_id: ID of the todo item
        todo_update: Updated todo data
        db: Database session
        current_user: Authenticated user
        
    Returns:
        Updated todo item
        
    Raises:
        HTTPException: If todo not found or access denied
    """
    todo = db.query(Todo).filter(
        Todo.id == todo_id,
        Todo.user_id == current_user.id
    ).first()
    
    if not todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found"
        )
    
    update_data = todo_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(todo, field, value)
    
    db.commit()
    db.refresh(todo)
    return todo


@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(
    todo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a todo item.
    
    Args:
        todo_id: ID of the todo item
        db: Database session
        current_user: Authenticated user
        
    Raises:
        HTTPException: If todo not found or access denied
    """
    todo = db.query(Todo).filter(
        Todo.id == todo_id,
        Todo.user_id == current_user.id
    ).first()
    
    if not todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found"
        )
    
    # Delete associated photos first
    photos = db.query(TodoPhoto).filter(TodoPhoto.todo_id == todo_id).all()
    for photo in photos:
        # Delete from S3 if configured
        s3_client = get_s3_client()
        if s3_client and getattr(photo, "s3_key", None):
            try:
                s3_client.delete_object(
                    Bucket=settings.AWS_S3_BUCKET,
                    Key=photo.s3_key
                )
            except ClientError:
                pass  # Log error but don't fail the deletion
        
        db.delete(photo)
    
    db.delete(todo)
    db.commit()


@router.post("/{todo_id}/photos", response_model=TodoPhotoSchema)
async def upload_photo(
    todo_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a photo for a todo item.
    
    Args:
        todo_id: ID of the todo item
        file: Uploaded photo file
        db: Database session
        current_user: Authenticated user
        
    Returns:
        Created photo record
        
    Raises:
        HTTPException: If todo not found, file invalid, or upload fails
    """
    # Verify todo exists and belongs to user
    todo = db.query(Todo).filter(
        Todo.id == todo_id,
        Todo.user_id == current_user.id
    ).first()
    
    if not todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found"
        )
    
    # Validate file type
    allowed_extensions = getattr(settings, 'ALLOWED_EXTENSIONS', ['.jpg', '.jpeg', '.png', '.gif'])
    filename = file.filename or ""
    file_extension = os.path.splitext(filename)[1].lower()
    
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {', '.join(allowed_extensions)}"
        )
    
    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    
    try:
        # Try S3 upload first
        s3_client = get_s3_client()
        if s3_client:
            s3_key = f"todo-photos/{current_user.id}/{unique_filename}"
            
            s3_client.upload_fileobj(
                file.file,
                settings.AWS_S3_BUCKET,
                s3_key,
                ExtraArgs={'ContentType': file.content_type}
            )
            
            photo_url = f"https://{settings.AWS_S3_BUCKET}.s3.{settings.AWS_REGION}.amazonaws.com/{s3_key}"
            
            # Save photo record
            db_photo = TodoPhoto(
                filename=file.filename,
                url=photo_url,
                s3_key=s3_key,
                todo_id=todo_id
            )
        else:
            # Fallback to local storage
            upload_dir = ensure_upload_directory()
            file_path = os.path.join(upload_dir, unique_filename)
            
            with open(file_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)
            
            photo_url = f"/uploads/{unique_filename}"
            
            # Save photo record
            db_photo = TodoPhoto(
                filename=file.filename,
                url=photo_url,
                s3_key="",
                todo_id=todo_id
            )
        
        db.add(db_photo)
        db.commit()
        db.refresh(db_photo)
        return db_photo
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload photo: {str(e)}"
        )


@router.delete("/photos/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_photo(
    photo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a photo from a todo item.
    
    Args:
        photo_id: ID of the photo
        db: Database session
        current_user: Authenticated user
        
    Raises:
        HTTPException: If photo not found or access denied
    """
    photo = db.query(TodoPhoto).join(Todo).filter(
        TodoPhoto.id == photo_id,
        Todo.user_id == current_user.id
    ).first()
    
    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo not found"
        )
    
    # Delete from S3 if configured
    s3_client = get_s3_client()
    if s3_client and getattr(photo, "s3_key", None) is not None and getattr(photo, "s3_key", None) != "":
        try:
            s3_client.delete_object(
                Bucket=settings.AWS_S3_BUCKET,
                Key=photo.s3_key
            )
        except ClientError:
            pass  # Log error but don't fail the deletion
    
    db.delete(photo)
    db.commit()


@router.delete("/column/{column_status}", status_code=status.HTTP_204_NO_CONTENT)
def bulk_delete_todos_by_status(
    column_status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Bulk delete all todos in a specific column/status.
    
    Args:
        column_status: Status of todos to delete (todo, inProgress, blocked, done)
        db: Database session
        current_user: Authenticated user
    """
    # Get all todos with the specified status
    todos = db.query(Todo).filter(
        Todo.user_id == current_user.id,
        Todo.status == column_status
    ).all()
    
    # Delete photos for all todos
    for todo in todos:
        photos = db.query(TodoPhoto).filter(TodoPhoto.todo_id == todo.id).all()
        for photo in photos:
            # Delete from S3 if configured
            s3_client = get_s3_client()
            if s3_client and getattr(photo, "s3_key", None) is not None and getattr(photo, "s3_key", None) != "":
                try:
                    s3_client.delete_object(
                        Bucket=settings.AWS_S3_BUCKET,
                        Key=photo.s3_key
                    )
                except ClientError:
                    pass
            db.delete(photo)
    
    # Delete all todos
    db.query(Todo).filter(
        Todo.user_id == current_user.id,
        Todo.status == column_status
    ).delete()
    
    db.commit()
