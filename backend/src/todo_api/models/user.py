"""
User model definitions.

This module contains the User model and related database models
for user authentication and profile management.
"""

from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from .base import BaseModel


class User(BaseModel):
    """
    User model for authentication and profile management.
    
    Attributes:
        email: User's email address (unique)
        name: User's display name
        google_id: Google OAuth ID (unique)
        is_active: Whether the user account is active
        todos: Related Todo items
        column_settings: User's column configuration
    """
    
    __tablename__ = "users"
    
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)
    google_id = Column(String, unique=True, index=True, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    todos = relationship(
        "Todo", 
        back_populates="owner", 
        cascade="all, delete-orphan",
        lazy="dynamic"
    )
    column_settings = relationship(
        "UserColumnSettings", 
        back_populates="user", 
        uselist=False, 
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, email='{self.email}')>"


class UserColumnSettings(BaseModel):
    """
    User column settings model for storing column configuration.
    
    Attributes:
        user_id: Foreign key to User
        column_order: JSON string of column order
        columns_config: JSON string of column configurations
        user: Related User instance
    """
    
    __tablename__ = "user_column_settings"
    
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    column_order = Column(Text, nullable=True)  # JSON string of column order
    columns_config = Column(Text, nullable=True)  # JSON string of column configurations
    
    # Relationships
    user = relationship("User", back_populates="column_settings")
    
    def __repr__(self) -> str:
        return f"<UserColumnSettings(id={self.id}, user_id={self.user_id})>"
