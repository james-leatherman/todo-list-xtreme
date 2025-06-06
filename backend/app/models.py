from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class User(Base):
    """User model for authentication"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    google_id = Column(String, unique=True, index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    todos = relationship("Todo", back_populates="owner", cascade="all, delete-orphan")


class Todo(Base):
    """Todo item model"""
    __tablename__ = "todos"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text, nullable=True)
    is_completed = Column(Boolean, default=False)
    status = Column(String, default="todo", nullable=True)  # Added status field for column position
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    owner = relationship("User", back_populates="todos")
    photos = relationship("TodoPhoto", back_populates="todo", cascade="all, delete-orphan")


class TodoPhoto(Base):
    """Model for todo item photos"""
    __tablename__ = "todo_photos"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String)
    url = Column(String)
    s3_key = Column(String, unique=True)
    todo_id = Column(Integer, ForeignKey("todos.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    todo = relationship("Todo", back_populates="photos")
