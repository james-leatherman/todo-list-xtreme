from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, HttpUrl


class TodoPhotoBase(BaseModel):
    """Base schema for todo photos"""
    filename: str


class TodoPhotoCreate(TodoPhotoBase):
    """Schema for creating todo photos"""
    pass


class TodoPhoto(TodoPhotoBase):
    """Schema for todo photos"""
    id: int
    url: str
    todo_id: int
    created_at: datetime

    class Config:
        orm_mode = True


class TodoBase(BaseModel):
    """Base schema for todos"""
    title: str
    description: Optional[str] = None
    is_completed: bool = False


class TodoCreate(TodoBase):
    """Schema for creating todos"""
    pass


class TodoUpdate(BaseModel):
    """Schema for updating todos"""
    title: Optional[str] = None
    description: Optional[str] = None
    is_completed: Optional[bool] = None


class Todo(TodoBase):
    """Schema for todos"""
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    photos: List[TodoPhoto] = []

    class Config:
        orm_mode = True


class UserBase(BaseModel):
    """Base schema for users"""
    email: str
    name: Optional[str] = None


class UserCreate(UserBase):
    """Schema for creating users"""
    pass


class User(UserBase):
    """Schema for users"""
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    todos: List[Todo] = []

    class Config:
        orm_mode = True


class Token(BaseModel):
    """Schema for JWT token"""
    access_token: str
    token_type: str


class TokenData(BaseModel):
    """Schema for JWT token data"""
    email: Optional[str] = None
