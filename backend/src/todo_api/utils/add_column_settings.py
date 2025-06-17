#!/usr/bin/env python3
# filepath: /root/todo-list-xtreme/backend/src/todo_api/utils/add_column_settings.py

import sys
import os

# Add src directory to Python path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
src_dir = os.path.dirname(os.path.dirname(current_dir))
if src_dir not in sys.path:
    sys.path.insert(0, src_dir)

# Import from todo_api structure (using type: ignore for Pylance)
from todo_api.config.database import Base, engine  # type: ignore
from todo_api.models import User, Todo, TodoPhoto, UserColumnSettings  # type: ignore

def add_column_settings_table():
    """Add UserColumnSettings table to the database."""
    # This will create the UserColumnSettings table if it doesn't already exist
    try:
        # Create only the UserColumnSettings table
        UserColumnSettings.__table__.create(bind=engine)
        print("UserColumnSettings table created successfully!")
    except Exception as e:
        print(f"Error creating table: {e}")
        # If table already exists, this is fine
        if "already exists" in str(e):
            print("UserColumnSettings table already exists.")
        else:
            raise e

if __name__ == "__main__":
    add_column_settings_table()
