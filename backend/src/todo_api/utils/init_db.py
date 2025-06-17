import sys
import os

# Add src directory to Python path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
src_dir = os.path.dirname(os.path.dirname(current_dir))
if src_dir not in sys.path:
    sys.path.insert(0, src_dir)

# Import from todo_api structure (using type: ignore for Pylance)
from todo_api.config.database import Base, engine  # type: ignore
from todo_api.models import User, Todo, TodoPhoto  # type: ignore

def init_db():
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

if __name__ == "__main__":
    init_db()
