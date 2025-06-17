#!/usr/bin/env python3
# Script to wipe all database tables in Todo List Xtreme

import os
import sys
from sqlalchemy import text

# Add the src directory to the path so we can import todo_api modules
current_dir = os.path.dirname(os.path.abspath(__file__))
src_dir = os.path.dirname(os.path.dirname(current_dir))
if src_dir not in sys.path:
    sys.path.insert(0, src_dir)

# Import from todo_api structure (using type: ignore for Pylance)
from todo_api.config.database import engine, Base  # type: ignore
from todo_api.models import User, Todo, TodoPhoto  # type: ignore
from todo_api.config.settings import settings  # type: ignore

def wipe_db():
    """
    Drop all tables from the database, effectively wiping it clean.
    """
    try:
        print(f"Connecting to database: {settings.DATABASE_URL.split('@')[1]}")
        print("WARNING: This will delete ALL data in the database!")
        confirmation = input("Type 'yes' to confirm: ")
        
        if confirmation.lower() != 'yes':
            print("Operation cancelled.")
            return

        print("Dropping all tables...")
        Base.metadata.drop_all(bind=engine)
        
        # Verify tables are gone by trying to list them
        with engine.connect() as connection:
            # This query works for PostgreSQL
            result = connection.execute(text("SELECT tablename FROM pg_tables WHERE schemaname = 'public';"))
            tables = [row[0] for row in result]
            
            if tables:
                print(f"Remaining tables in database: {', '.join(tables)}")
            else:
                print("All tables successfully dropped!")
        
        print("\nTo re-initialize the database, run:")
        print("python init_db.py")
        
    except Exception as e:
        print(f"Error wiping database: {e}")
        sys.exit(1)

if __name__ == "__main__":
    wipe_db()
