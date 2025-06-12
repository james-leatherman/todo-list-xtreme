"""
Test configuration and fixtures.

This module provides common test configuration, fixtures, and utilities
for testing the Todo List Xtreme API.
"""

import os
import sys
import tempfile
from typing import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

# Add src directory to path for new structure imports
current_dir = os.path.dirname(os.path.abspath(__file__))
src_dir = os.path.join(current_dir, '..', 'src')
if src_dir not in sys.path:
    sys.path.insert(0, src_dir)

# Import from old structure (during transition period)
from app.database import Base, get_db
from app.models import User, Todo, UserColumnSettings
from app.main import app

# Test database URL - using SQLite for testing
TEST_DATABASE_URL = "sqlite:///./test.db"


@pytest.fixture(scope="session")
def auth_token():
    """Legacy auth token fixture for existing tests."""
    token = os.environ.get("TEST_AUTH_TOKEN")
    if not token:
        pytest.skip("TEST_AUTH_TOKEN environment variable not set")
    return token


@pytest.fixture(scope="session")
def test_engine():
    """Create test database engine."""
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},  # SQLite specific
        echo=False,
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def test_db(test_engine) -> Generator[Session, None, None]:
    """Create test database session."""
    TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def client(test_db: Session) -> Generator[TestClient, None, None]:
    """Create test client with test database."""
    
    def override_get_db():
        try:
            yield test_db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    # Clean up
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(test_db: Session) -> User:
    """Create a test user."""
    user = User(
        email="test@example.com",
        name="Test User",
        google_id="test-google-id",
        is_active=True
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user


@pytest.fixture
def test_todo(test_db: Session, test_user: User) -> Todo:
    """Create a test todo."""
    todo = Todo(
        title="Test Todo",
        description="Test Description",
        status="todo",
        user_id=test_user.id
    )
    test_db.add(todo)
    test_db.commit()
    test_db.refresh(todo)
    return todo


@pytest.fixture
def test_column_settings(test_db: Session, test_user: User) -> UserColumnSettings:
    """Create test column settings with blocked column."""
    settings = UserColumnSettings(
        user_id=test_user.id,
        column_order='["todo", "inProgress", "blocked", "done"]',
        columns_config='{"todo": {"id": "todo", "title": "To Do", "taskIds": []}, "inProgress": {"id": "inProgress", "title": "In Progress", "taskIds": []}, "blocked": {"id": "blocked", "title": "Blocked", "taskIds": []}, "done": {"id": "done", "title": "Completed", "taskIds": []}}'
    )
    test_db.add(settings)
    test_db.commit()
    test_db.refresh(settings)
    return settings


@pytest.fixture
def auth_headers(test_user: User) -> dict:
    """Create authentication headers for test requests."""
    return {"Authorization": f"Bearer test-token-{test_user.id}"}


@pytest.fixture
def temp_upload_dir():
    """Create temporary upload directory for file upload tests."""
    with tempfile.TemporaryDirectory() as temp_dir:
        yield temp_dir


# Pytest configuration
def pytest_configure(config):
    """Configure pytest with custom markers."""
    config.addinivalue_line(
        "markers", "unit: mark test as a unit test"
    )
    config.addinivalue_line(
        "markers", "integration: mark test as an integration test"
    )
    config.addinivalue_line(
        "markers", "slow: mark test as slow running"
    )


# Clean up test database after each test
@pytest.fixture(autouse=True)
def clean_test_db(test_db: Session):
    """Clean up test database after each test."""
    yield
    # Clean up all test data
    test_db.query(UserColumnSettings).delete()
    test_db.query(Todo).delete()
    test_db.query(User).delete()
    test_db.commit()
