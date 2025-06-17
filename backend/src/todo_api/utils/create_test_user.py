import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from jose import jwt
from datetime import datetime, timedelta, timezone

# Add src directory to Python path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
src_dir = os.path.dirname(os.path.dirname(current_dir))
if src_dir not in sys.path:
    sys.path.insert(0, src_dir)

# Import from todo_api structure (using type: ignore for Pylance)
from todo_api.models import User, Base  # type: ignore
from todo_api.config.settings import settings  # type: ignore
from todo_api.config.database import get_db  # type: ignore

# Create a test user and a JWT token for testing purposes

def create_test_user():
    # Create engine and session
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Create a test user
        test_user = User(
            email="test@example.com",
            name="Test User",
            google_id="test123"
        )
        
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == test_user.email).first()
        if existing_user:
            print(f"User {test_user.email} already exists with ID: {existing_user.id}")
            user_id = existing_user.id
            # Update the existing user to ensure it's valid
            setattr(existing_user, "name", "Test User")
            setattr(existing_user, "google_id", "test123")
            db.commit()
        else:
            # Add the new user
            db.add(test_user)
            db.commit()
            db.refresh(test_user)
            user_id = test_user.id
            print(f"Created new user with ID: {user_id}")
        
        # Create a token that will be valid for 365 days (long-lasting for dev purposes)
        expires_delta = timedelta(days=365)
        expire = datetime.now(timezone.utc) + expires_delta
        
        # Create JWT token
        to_encode = {"sub": test_user.email, "exp": expire}
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        
        # Write token to frontend environment file
        project_root = os.path.abspath(os.path.join(current_dir, '..', '..', '..', '..'))
        frontend_env_file = os.path.join(project_root, 'frontend', '.env.development.local')
        
        try:
            # Update the REACT_APP_TEST_TOKEN in the frontend env file
            with open(frontend_env_file, 'w') as f:
                f.write(f"REACT_APP_TEST_TOKEN={encoded_jwt}\n")
            print(f"✓ Updated frontend token in: {frontend_env_file}")
        except Exception as e:
            print(f"⚠ Could not update frontend token: {e}")
        
        print("\n=== Test Auth Information ===")
        print(f"User ID: {user_id}")
        print(f"Email: {test_user.email}")
        print(f"JWT Token: {encoded_jwt}")
        print("============================\n")
        print("You can use this token for testing purposes.")
        print("Token has been automatically set in frontend/.env.development.local for development.")
        
    finally:
        db.close()

if __name__ == "__main__":
    create_test_user()
