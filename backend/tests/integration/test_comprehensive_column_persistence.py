#!/usr/bin/env python3
"""
Comprehensive test script for column persistence in Todo List Xtreme
Tests both empty columns and column order persistence
"""
import json
import requests
import sys
import time
import pytest

def test_column_persistence(auth_token):
    """Test column persistence for both empty columns and column order"""
    base_url = 'http://localhost:8000'
    headers = {'Authorization': f'Bearer {auth_token}'}
    
    # Step 1: Clear existing column settings to start fresh
    print("\n=== Step 1: Clearing existing column settings ===")
    try:
        response = requests.get(f'{base_url}/api/v1/column-settings/', headers=headers)
        if response.status_code == 200:
            print("Found existing column settings, will clear them")
            
            # Create default columns to reset
            default_columns = {
                'todo': {'id': 'todo', 'title': 'To Do', 'taskIds': []},
                'inProgress': {'id': 'inProgress', 'title': 'In Progress', 'taskIds': []},
                'blocked': {'id': 'blocked', 'title': 'Blocked', 'taskIds': []},
                'done': {'id': 'done', 'title': 'Completed', 'taskIds': []}
            }
            default_column_order = ['todo', 'inProgress', 'blocked', 'done']
            
            payload = {
                'columns_config': json.dumps(default_columns),
                'column_order': json.dumps(default_column_order)
            }
            
            # Update with defaults
            response = requests.put(f'{base_url}/api/v1/column-settings/', headers=headers, json=payload)
            print(f"Reset to defaults: {response.status_code}")
        else:
            print(f"No existing column settings found: {response.status_code}")
    except Exception as e:
        print(f"Error checking column settings: {e}")
        assert False, f"Error checking column settings: {e}"
    
    # Step 2: Create test columns including an empty column
    print("\n=== Step 2: Creating test columns including empty column ===")
    test_columns = {
        'todo': {'id': 'todo', 'title': 'To Do', 'taskIds': []},
        'inProgress': {'id': 'inProgress', 'title': 'In Progress', 'taskIds': []},
        'done': {'id': 'done', 'title': 'Completed', 'taskIds': []},
        'empty-test': {'id': 'empty-test', 'title': 'Empty Test Column', 'taskIds': []},
        'another-empty': {'id': 'another-empty', 'title': 'Another Empty Column', 'taskIds': []}
    }
    
    # Order the columns differently from their definition order to test order persistence
    test_column_order = ['todo', 'empty-test', 'inProgress', 'another-empty', 'done']
    
    payload = {
        'columns_config': json.dumps(test_columns),
        'column_order': json.dumps(test_column_order)
    }
    
    try:
        response = requests.put(f'{base_url}/api/v1/column-settings/', headers=headers, json=payload)
        print(f"Create test columns response: {response.status_code}")
        assert response.status_code in (200, 201), f"Failed to create test columns: {response.text}"
    except Exception as e:
        print(f"Error creating test columns: {e}")
        assert False, f"Error creating test columns: {e}"
    
    # Step 3: Verify the column settings were saved correctly
    print("\n=== Step 3: Verifying column settings ===")
    try:
        response = requests.get(f'{base_url}/api/v1/column-settings/', headers=headers)
        assert response.status_code == 200, f"Failed to get column settings: {response.status_code}\n{response.text}"
        settings = response.json()
        saved_columns = settings['columns_config']
        saved_order = settings['column_order']
        assert 'empty-test' in saved_columns and 'another-empty' in saved_columns, f"Empty test columns NOT found in saved data: {list(saved_columns.keys())}"
        assert saved_order == test_column_order, f"Column order not persisted correctly. Expected: {test_column_order}, Got: {saved_order}"
        print("Initial verification successful!")
    except Exception as e:
        print(f"Error verifying column settings: {e}")
        assert False, f"Error verifying column settings: {e}"
    
    # Step 4: Create a todo to ensure todos get properly assigned to columns
    print("\n=== Step 4: Creating a test todo ===")
    todo_payload = {
        "title": "Test Todo",
        "description": "This is a test todo to verify column persistence",
        "is_completed": False,
        "status": "inProgress"
    }
    
    try:
        response = requests.post(f'{base_url}/api/v1/todos/', headers=headers, json=todo_payload)
        assert response.status_code == 201, f"Failed to create test todo: {response.status_code}\n{response.text}"
        todo_id = response.json()['id']
        print(f"Created test todo with ID: {todo_id}")
    except Exception as e:
        print(f"Error creating test todo: {e}")
        assert False, f"Error creating test todo: {e}"
    
    # Step 5: Get column settings again to verify empty columns still exist after todo creation
    print("\n=== Step 5: Verifying column persistence after todo creation ===")
    time.sleep(1)  # Small delay to ensure server has processed the todo creation
    
    try:
        response = requests.get(f'{base_url}/api/v1/column-settings/', headers=headers)
        assert response.status_code == 200, f"Failed to get column settings: {response.status_code}\n{response.text}"
        settings = response.json()
        saved_columns = settings['columns_config']
        saved_order = settings['column_order']
        assert 'empty-test' in saved_columns and 'another-empty' in saved_columns, f"Empty test columns were lost after todo creation: {list(saved_columns.keys())}"
        assert saved_order == test_column_order, f"Column order changed after todo creation. Expected: {test_column_order}, Got: {saved_order}"
        in_progress_tasks = saved_columns['inProgress']['taskIds']
        assert todo_id in in_progress_tasks or str(todo_id) in in_progress_tasks, f"Todo {todo_id} not found in 'inProgress' column tasks: {in_progress_tasks}"
        print("Column persistence verification after todo creation successful!")
    except Exception as e:
        print(f"Error verifying column settings: {e}")
        assert False, f"Error verifying column settings: {e}"
    
    # Clean up - delete the test todo if needed
    try:
        response = requests.delete(f'{base_url}/api/v1/todos/{todo_id}/', headers=headers)
        assert response.status_code == 204, f"Failed to clean up test todo: {response.status_code}"
        print(f"Cleaned up test todo with ID: {todo_id}")
    except Exception as e:
        print(f"Warning: Error cleaning up test todo: {e}")
