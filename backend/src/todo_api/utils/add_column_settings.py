#!/usr/bin/env python3
# filepath: /root/todo-list-xtreme/backend/add_column_settings.py

from app.database import Base, engine
from app.models import User, Todo, TodoPhoto, UserColumnSettings

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
