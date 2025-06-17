#!/usr/bin/env python3

import sys
import os
import traceback

# Add src directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
# current_dir is /root/todo-list-xtreme/backend
src_dir = os.path.join(current_dir, 'src')
sys.path.insert(0, src_dir)

print(f"Current dir: {current_dir}")
print(f"Src dir: {src_dir}")
print(f"Python path: {sys.path[:3]}")

try:
    print("Step 1: Importing SQLAlchemy...")
    from sqlalchemy import create_engine, inspect
    print("✅ SQLAlchemy imported")

    print("Step 2: Loading environment...")
    from dotenv import load_dotenv
    load_dotenv()
    print("✅ Environment loaded")

    print("Step 3: Importing settings...")
    from todo_api.config.settings import get_settings  # type: ignore
    settings = get_settings()
    print(f"✅ Settings imported, DB URL: {settings.DATABASE_URL}")

    print("Step 4: Importing database config...")
    from todo_api.config.database import Base, get_database_engine  # type: ignore
    print("✅ Database config imported")

    print("Step 5: Creating engine...")
    engine = get_database_engine()
    print(f"✅ Engine created: {engine.url}")

    print("Step 6: Testing database connection...")
    from sqlalchemy import text
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        print("✅ Database connection successful")

    print("Step 7: Importing User model...")
    from todo_api.models.user import User  # type: ignore
    print(f"✅ User model imported, table: {User.__tablename__}")

    print("Step 8: Importing Todo model...")
    from todo_api.models.todo import Todo  # type: ignore
    print(f"✅ Todo model imported, table: {Todo.__tablename__}")

    print("Step 9: Checking Base metadata...")
    print(f"Tables in Base metadata: {list(Base.metadata.tables.keys())}")

    print("Step 10: Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ create_all completed")

    print("Step 11: Verifying tables were created...")
    inspector = inspect(engine)
    actual_tables = inspector.get_table_names()
    print(f"Actual tables in database: {actual_tables}")

except Exception as e:
    print(f"❌ Error occurred: {e}")
    print("Full traceback:")
    traceback.print_exc()
