#!/usr/bin/env python3
# Update existing todos to have a status value based on their completion status

import sys
import os

# Add src directory to path
backend_dir = os.path.dirname(os.path.abspath(__file__))
src_dir = os.path.join(os.path.dirname(backend_dir), 'src')
sys.path.insert(0, src_dir)

from sqlalchemy.orm import Session
from todo_api.config.database import SessionLocal, engine  # type: ignore
from todo_api.models import Todo  # type: ignore

def update_todos_status():
    db = SessionLocal()
    try:
        # Get all todos
        todos = db.query(Todo).all()
        
        # Update status based on is_completed
        for todo in todos:
            if getattr(todo, "status", None) is None:
                setattr(todo, "status", "done" if getattr(todo, "is_completed", False) else "todo")
                print(f"Updating todo {todo.id}: '{todo.title}' to status '{todo.status}'")
        
        # Commit changes
        db.commit()
        print(f"Updated {len(todos)} todo items with status values.")
    
    except Exception as e:
        db.rollback()
        print(f"Error updating todos: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    update_todos_status()
