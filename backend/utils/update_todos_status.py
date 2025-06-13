#!/usr/bin/env python3
# Update existing todos to have a status value based on their completion status

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import Todo

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
