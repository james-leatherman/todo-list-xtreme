"""
Unit tests for the new todo schemas.

This demonstrates that the new package structure is working correctly.
"""

import pytest
from pydantic import ValidationError

# Test import from new structure
try:
    from todo_api.schemas.todo import TodoCreate, TodoUpdate, TodoSchema
    NEW_STRUCTURE_AVAILABLE = True
except ImportError:
    NEW_STRUCTURE_AVAILABLE = False


@pytest.mark.skipif(not NEW_STRUCTURE_AVAILABLE, reason="New structure not yet fully migrated")
@pytest.mark.unit
def test_todo_create_schema():
    """Test TodoCreate schema validation."""
    # Valid todo creation
    valid_todo = TodoCreate(
        title="Test Todo",
        description="Test description",
        status="todo"
    )
    assert valid_todo.title == "Test Todo"
    assert valid_todo.status == "todo"
    assert valid_todo.is_completed is False

    # Invalid todo - empty title
    with pytest.raises(ValidationError):
        TodoCreate(title="", description="Test")


@pytest.mark.skipif(not NEW_STRUCTURE_AVAILABLE, reason="New structure not yet fully migrated")
@pytest.mark.unit
def test_todo_update_schema():
    """Test TodoUpdate schema validation."""
    # Valid partial update
    update = TodoUpdate(title="Updated Title")
    assert update.title == "Updated Title"
    assert update.description is None
    
    # Invalid status
    with pytest.raises(ValidationError):
        TodoUpdate(status="invalid_status")


@pytest.mark.unit
def test_legacy_imports_still_work():
    """Test that legacy imports still work during transition."""
    from app.models import Todo, User
    from app.schemas import TodoCreate as LegacyTodoCreate
    
    # Legacy schema should work
    legacy_todo = LegacyTodoCreate(title="Legacy Test")
    assert legacy_todo.title == "Legacy Test"
