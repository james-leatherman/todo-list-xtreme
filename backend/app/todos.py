from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
import boto3
from botocore.exceptions import ClientError
import uuid
import os
import json

from app.auth import get_current_user
from app.database import get_db
from app.models import User, Todo, TodoPhoto, UserColumnSettings
from app.schemas import Todo as TodoSchema, TodoCreate, TodoUpdate, TodoPhoto as TodoPhotoSchema
from app.config import settings

router = APIRouter()

# Initialize S3 client
s3_client = boto3.client(
    's3',
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    region_name=settings.AWS_REGION
) if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY else None

# Local upload directory (fallback if S3 is not configured)
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("/", response_model=List[TodoSchema])
def get_todos(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all todos for current user"""
    todos = db.query(Todo).filter(Todo.user_id == current_user.id).offset(skip).limit(limit).all()
    return todos


@router.post("/", response_model=TodoSchema, status_code=status.HTTP_201_CREATED)
def create_todo(
    todo: TodoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new todo item"""
    db_todo = Todo(**todo.dict(), user_id=current_user.id)
    db.add(db_todo)
    db.commit()
    db.refresh(db_todo)

    # --- COLUMN SETTINGS SYNC ---
    user_settings = db.query(UserColumnSettings).filter(UserColumnSettings.user_id == current_user.id).first()
    if user_settings:
        columns_config_str = getattr(user_settings, 'columns_config', None)
        columns = json.loads(columns_config_str) if columns_config_str else {}
        status = db_todo.status or "todo"
        # Remove from all columns first (defensive, shouldn't be needed on create)
        for col in columns.values():
            if db_todo.id in col.get("taskIds", []):
                col["taskIds"] = [tid for tid in col["taskIds"] if tid != db_todo.id]
        # Add to the correct column
        if status in columns:
            if db_todo.id not in columns[status]["taskIds"]:
                columns[status]["taskIds"].append(db_todo.id)
        else:
            columns[status] = {"id": status, "title": status.title(), "taskIds": [db_todo.id]}
        setattr(user_settings, 'columns_config', json.dumps(columns))
        db.commit()
        db.refresh(user_settings)
    # --- END COLUMN SETTINGS SYNC ---

    return db_todo


@router.get("/{todo_id}", response_model=TodoSchema)
def get_todo(todo_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get a specific todo by ID"""
    todo = db.query(Todo).filter(Todo.id == todo_id, Todo.user_id == current_user.id).first()
    if todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")
    return todo


@router.put("/{todo_id}", response_model=TodoSchema)
def update_todo(
    todo_id: int,
    todo_update: TodoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a todo item"""
    todo = db.query(Todo).filter(Todo.id == todo_id, Todo.user_id == current_user.id).first()
    if todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")
    old_status = todo.status or "todo"
    update_data = todo_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(todo, key, value)
    db.commit()
    db.refresh(todo)

    # --- COLUMN SETTINGS SYNC ---
    user_settings = db.query(UserColumnSettings).filter(UserColumnSettings.user_id == current_user.id).first()
    if user_settings:
        columns_config_str = getattr(user_settings, 'columns_config', None)
        columns = json.loads(columns_config_str) if columns_config_str else {}
        new_status = todo.status or "todo"
        # Remove from all columns
        for col in columns.values():
            if todo.id in col.get("taskIds", []):
                col["taskIds"] = [tid for tid in col["taskIds"] if tid != todo.id]
        # Add to the new status column
        if new_status in columns:
            if todo.id not in columns[new_status]["taskIds"]:
                columns[new_status]["taskIds"].append(todo.id)
        else:
            columns[new_status] = {"id": new_status, "title": new_status.title(), "taskIds": [todo.id]}
        setattr(user_settings, 'columns_config', json.dumps(columns))
        db.commit()
        db.refresh(user_settings)
    # --- END COLUMN SETTINGS SYNC ---

    return todo


@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(todo_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Delete a todo item"""
    todo = db.query(Todo).filter(Todo.id == todo_id, Todo.user_id == current_user.id).first()
    if todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")
    
    # Delete associated photos from S3 if using S3
    if s3_client and todo.photos:
        for photo in todo.photos:
            try:
                s3_client.delete_object(Bucket=settings.AWS_S3_BUCKET, Key=photo.s3_key)
            except ClientError:
                pass  # Continue with deletion even if S3 deletion fails
    
    db.delete(todo)
    db.commit()
    return None


@router.post("/{todo_id}/photos", response_model=TodoPhotoSchema)
async def upload_todo_photo(
    todo_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload a photo for a todo item"""
    # Check if todo exists and belongs to the current user
    todo = db.query(Todo).filter(Todo.id == todo_id, Todo.user_id == current_user.id).first()
    if todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")
    
    # Generate unique filename
    file_ext = os.path.splitext(file.filename)[1] # type: ignore
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    
    # Handle file upload
    if s3_client:
        # Upload to S3
        s3_key = f"todo-photos/{current_user.id}/{todo_id}/{unique_filename}"
        try:
            s3_client.upload_fileobj(file.file, settings.AWS_S3_BUCKET, s3_key)
            url = f"https://{settings.AWS_S3_BUCKET}.s3.amazonaws.com/{s3_key}"
        except ClientError:
            raise HTTPException(status_code=500, detail="Failed to upload file to S3")
    else:
        # Save locally
        user_upload_dir = os.path.join(UPLOAD_DIR, str(current_user.id), str(todo_id))
        os.makedirs(user_upload_dir, exist_ok=True)
        
        file_path = os.path.join(user_upload_dir, unique_filename)
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        s3_key = None
        url = f"/uploads/{current_user.id}/{todo_id}/{unique_filename}"
    
    # Create photo record in database
    db_photo = TodoPhoto(
        filename=file.filename,
        url=url,
        s3_key=s3_key,
        todo_id=todo_id
    )
    db.add(db_photo)
    db.commit()
    db.refresh(db_photo)
    
    return db_photo


@router.delete("/{todo_id}/photos/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo_photo(
    todo_id: int,
    photo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a photo from a todo item"""
    # Check if todo exists and belongs to the current user
    todo = db.query(Todo).filter(Todo.id == todo_id, Todo.user_id == current_user.id).first()
    if todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")
    
    # Find the photo
    photo = db.query(TodoPhoto).filter(TodoPhoto.id == photo_id, TodoPhoto.todo_id == todo_id).first()
    if photo is None:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    # Delete from S3 if using S3
    if s3_client and photo.s3_key: # type: ignore
        try:
            s3_client.delete_object(Bucket=settings.AWS_S3_BUCKET, Key=photo.s3_key)
        except ClientError:
            pass  # Continue with deletion even if S3 deletion fails
    
    # Delete from database
    db.delete(photo)
    db.commit()
    
    return None


@router.post("/test/create-sample-todos", response_model=List[TodoSchema])
def create_sample_todos(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create sample todo items for testing"""
    # Sample todo data
    sample_todos = [
        {"title": "Complete project documentation", "description": "Write detailed documentation for the Todo List Xtreme app"},
        {"title": "Setup CI/CD pipeline", "description": "Configure GitHub Actions workflow for continuous integration"},
        {"title": "Add unit tests", "description": "Increase test coverage to at least 80%"},
        {"title": "Design landing page", "description": "Create a responsive landing page for the application"},
        {"title": "Fix mobile view issues", "description": "Address styling problems on small screens"},
    ]
    
    # Create todos
    created_todos = []
    for todo_data in sample_todos:
        db_todo = Todo(**todo_data, user_id=current_user.id)
        db.add(db_todo)
        db.commit()
        db.refresh(db_todo)
        created_todos.append(db_todo)
    
    return created_todos
