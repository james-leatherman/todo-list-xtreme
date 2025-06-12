"""
Todo model definitions.

This module contains the Todo model and related database models
for todo items and their associated photos.
"""

from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from .base import BaseModel


class Todo(BaseModel):
    """
    Todo item model.
    
    Attributes:
        title: Todo item title
        description: Optional detailed description
        is_completed: Whether the todo is completed
        status: Current status/column position (todo, inProgress, blocked, done)
        user_id: Foreign key to User who owns this todo
        owner: Related User instance
        photos: Related TodoPhoto instances
    """
    
    __tablename__ = "todos"
    
    title = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    is_completed = Column(Boolean, default=False, nullable=False)
    status = Column(String, default="todo", nullable=False)  # Column position
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    owner = relationship("User", back_populates="todos")
    photos = relationship(
        "TodoPhoto", 
        back_populates="todo", 
        cascade="all, delete-orphan",
        lazy="dynamic"
    )
    
    def __repr__(self) -> str:
        return f"<Todo(id={self.id}, title='{self.title}', status='{self.status}')>"


class TodoPhoto(BaseModel):
    """
    Model for todo item photos.
    
    Attributes:
        filename: Original filename of the uploaded photo
        url: URL where the photo can be accessed
        s3_key: Unique key for S3 storage
        todo_id: Foreign key to Todo item
        todo: Related Todo instance
    """
    
    __tablename__ = "todo_photos"
    
    filename = Column(String, nullable=False)
    url = Column(String, nullable=False)
    s3_key = Column(String, unique=True, nullable=False)
    todo_id = Column(Integer, ForeignKey("todos.id"), nullable=False)
    
    # Relationships
    todo = relationship("Todo", back_populates="photos")
    
    def __repr__(self) -> str:
        return f"<TodoPhoto(id={self.id}, filename='{self.filename}')>"
