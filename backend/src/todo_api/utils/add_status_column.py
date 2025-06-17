#!/usr/bin/env python3
# Add status column to todos table

import os
import sys
import psycopg2

# Add src directory to Python path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
src_dir = os.path.dirname(os.path.dirname(current_dir))
if src_dir not in sys.path:
    sys.path.insert(0, src_dir)

# Import from todo_api structure (using type: ignore for Pylance)
from todo_api.config.settings import settings  # type: ignore

def add_status_column():
    # Connect to the database
    conn = psycopg2.connect(
        dbname=settings.POSTGRES_DB,
        user=settings.POSTGRES_USER,
        password=settings.POSTGRES_PASSWORD,
        host=settings.POSTGRES_SERVER,
        port=settings.POSTGRES_PORT
    )
    conn.autocommit = True
    cursor = conn.cursor()
    
    try:
        # Check if column exists
        cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name='todos' AND column_name='status';")
        if cursor.fetchone() is None:
            print("Adding 'status' column to todos table...")
            # Add the status column
            cursor.execute("ALTER TABLE todos ADD COLUMN status VARCHAR DEFAULT 'todo';")
            
            # Update existing rows based on is_completed
            cursor.execute("UPDATE todos SET status = 'done' WHERE is_completed = TRUE;")
            cursor.execute("UPDATE todos SET status = 'todo' WHERE is_completed = FALSE;")
            
            print("Status column added and values updated successfully!")
        else:
            print("Status column already exists.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    add_status_column()
