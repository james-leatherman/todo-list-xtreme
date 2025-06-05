from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

from app.models import User, Base
from app.config import settings
from app.database import get_db
from jose import jwt
from datetime import datetime, timedelta, timezone

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
        else:
            # Add the new user
            db.add(test_user)
            db.commit()
            db.refresh(test_user)
            user_id = test_user.id
            print(f"Created new user with ID: {user_id}")
        
        # Create a token that will be valid for 24 hours
        expires_delta = timedelta(hours=24)
        expire = datetime.now(timezone.utc) + expires_delta
        
        # Create JWT token
        to_encode = {"sub": test_user.email, "exp": expire}
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        
        print("\n=== Test Auth Information ===")
        print(f"User ID: {user_id}")
        print(f"Email: {test_user.email}")
        print(f"JWT Token: {encoded_jwt}")
        print("============================\n")
        print("You can use this token for testing purposes.")
        print("Add it to your frontend local storage with key 'token' or use as Authorization: Bearer <token> header.")
        
    finally:
        db.close()

if __name__ == "__main__":
    create_test_user()
