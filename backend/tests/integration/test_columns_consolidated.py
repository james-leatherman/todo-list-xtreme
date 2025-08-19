#!/usr/bin/env python3
"""
Consolidated test script for Todo List Xtreme column functionality
This combines the tests from:
- test_comprehensive_column_persistence.py
- test_empty_column_persistence.py
- test_column_settings.py
- test_blocked_column.py
"""
import json
import requests
import sys
import time
import pytest

def test_column_settings_crud(auth_token):
    """Test basic CRUD operations for column settings"""
    base_url = 'http://localhost:8000'
    headers = {'Authorization': f'Bearer {auth_token}'}
    
    print("\n=== Column Settings CRUD Tests ===")
    
    # Test data
    test_columns = {
        'todo': {'id': 'todo', 'title': 'To Do', 'taskIds': []},
        'inProgress': {'id': 'inProgress', 'title': 'In Progress', 'taskIds': []},
        'done': {'id': 'done', 'title': 'Done', 'taskIds': []},
        'custom': {'id': 'custom', 'title': 'Custom Column', 'taskIds': []}
    }
    test_column_order = ['todo', 'inProgress', 'custom', 'done']
    
    # Create test payload
    payload = {
        "columns_config": json.dumps(test_columns),
        "column_order": json.dumps(test_column_order)
    }
    
    # Step 1: GET column settings (should create default if not exist)
    print("1. Testing GET column settings...")
    try:
        response = requests.get(f"{base_url}/api/v1/column-settings/", headers=headers)
        assert response.status_code == 200, f"Failed to get column settings: {response.status_code}"
        print(f"Success! Received column settings, status code: {response.status_code}")
    except Exception as e:
        print(f"Error retrieving settings: {e}")
        assert False, f"Error retrieving settings: {e}"
    
    # Step 2: PUT column settings (update)
    print("\n2. Testing PUT column settings (update)...")
    try:
        response = requests.put(f"{base_url}/api/v1/column-settings/", json=payload, headers=headers)
        if response.status_code == 200:
            print(f"Success! Column settings updated, status code: {response.status_code}")
        else:
            # Try creating if updating failed
            print("Update failed, trying POST instead...")
            response = requests.post(f"{base_url}/api/v1/column-settings/", json=payload, headers=headers)
            assert response.status_code in [200, 201], f"Failed to create column settings: {response.status_code}"
            print(f"Success! Column settings created, status code: {response.status_code}")
    except Exception as e:
        print(f"Error saving settings: {e}")
        assert False, f"Error saving settings: {e}"
    
    # Step 3: Verify settings were saved
    print("\n3. Verifying column settings were saved...")
    try:
        response = requests.get(f"{base_url}/api/v1/column-settings/", headers=headers)
        assert response.status_code == 200, f"Failed to get column settings: {response.status_code}"
        
        data = response.json()
        saved_columns = data["columns_config"]
        saved_order = data["column_order"]
        
        assert "custom" in saved_columns, "Custom column not found in saved columns"
        assert "custom" in saved_order, "Custom column not found in saved column order"
        print("Success! Verified custom column was saved.")
    except Exception as e:
        print(f"Error verifying settings: {e}")
        assert False, f"Error verifying settings: {e}"


def test_empty_column_persistence(auth_token):
    """Test that empty columns are persisted correctly"""
    base_url = 'http://localhost:8000'
    headers = {'Authorization': f'Bearer {auth_token}'}
    
    print("\n=== Empty Column Persistence Test ===")
    
    # Define a test column with no tasks
    test_columns = {
        'todo': {'id': 'todo', 'title': 'To Do', 'taskIds': []},
        'inProgress': {'id': 'inProgress', 'title': 'In Progress', 'taskIds': []},
        'blocked': {'id': 'blocked', 'title': 'Blocked', 'taskIds': []},
        'done': {'id': 'done', 'title': 'Completed', 'taskIds': []},
        'empty-test': {'id': 'empty-test', 'title': 'Empty Test Column', 'taskIds': []}
    }
    test_column_order = ['todo', 'inProgress', 'blocked', 'done', 'empty-test']
    
    # Save settings
    settings_payload = {
        'columns_config': json.dumps(test_columns),
        'column_order': json.dumps(test_column_order)
    }
    
    try:
        response = requests.put(
            f'{base_url}/api/v1/column-settings/',
            headers=headers,
            json=settings_payload
        )
        print(f"Update response: {response.status_code}")
        if response.status_code != 200:
            response = requests.post(
                f'{base_url}/api/v1/column-settings/',
                headers=headers,
                json=settings_payload
            )
            print(f"Create response: {response.status_code}")
        assert response.status_code in [200, 201], f"Failed to save settings: {response.status_code}"
    except Exception as e:
        print(f"Error saving settings: {e}")
        assert False, f"Error saving settings: {e}"
    
    # Get settings and verify
    try:
        response = requests.get(
            f'{base_url}/api/v1/column-settings/',
            headers=headers
        )
        assert response.status_code == 200, f"Failed to retrieve settings: {response.status_code}"
        
        settings = response.json()
        retrieved_columns = settings['columns_config']
        retrieved_order = settings['column_order']
        
        assert 'empty-test' in retrieved_columns, "Empty test column not found in retrieved data"
        position = retrieved_order.index('empty-test') if 'empty-test' in retrieved_order else -1
        assert position == 4, f"Column order changed, expected at position 4, found at {position}"
        assert retrieved_order == test_column_order, f"Expected column order: {test_column_order}, Got: {retrieved_order}"
        
        print("SUCCESS: Empty test column found in retrieved data")
        print(f"SUCCESS: Empty test column found at position {position} in column order")
        print("SUCCESS: Column order correctly preserved")
    except Exception as e:
        print(f"Error verifying settings: {e}")
        assert False, f"Error verifying settings: {e}"


def test_comprehensive_column_persistence(auth_token):
    """Test column persistence for both empty columns and column order with todos"""
    base_url = 'http://localhost:8000'
    headers = {'Authorization': f'Bearer {auth_token}'}
    
    print("\n=== Comprehensive Column Persistence Test ===")
    
    # Step 1: Clear existing column settings to start fresh
    print("\n=== Step 1: Clearing existing column settings ===")
    try:
        response = requests.get(f'{base_url}/api/v1/column-settings/', headers=headers)
        if response.status_code == 200:
            print("Found existing column settings, will reset to defaults")
            
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
    
    # Step 2: Create test columns including empty columns
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
        assert response.status_code == 200, f"Failed to get column settings: {response.status_code}"
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
        assert response.status_code == 201, f"Failed to create test todo: {response.status_code}"
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
        assert response.status_code == 200, f"Failed to get column settings: {response.status_code}"
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
    
    # Clean up - delete the test todo
    try:
        response = requests.delete(f'{base_url}/api/v1/todos/{todo_id}/', headers=headers)
        assert response.status_code == 204, f"Failed to clean up test todo: {response.status_code}"
        print(f"Cleaned up test todo with ID: {todo_id}")
    except Exception as e:
        print(f"Warning: Error cleaning up test todo: {e}")


def test_blocked_column_functionality(auth_token):
    """Test that the Blocked column is properly implemented and functional"""
    base_url = 'http://localhost:8000'
    headers = {'Authorization': f'Bearer {auth_token}'}
    
    print("\n=== Blocked Column Functionality Test ===")
    
    # Step 1: Ensure we have a column settings with a 'blocked' column
    print("\n=== Step 1: Setting up column settings with 'blocked' column ===")
    try:
        # Check if column settings exist
        response = requests.get(f'{base_url}/api/v1/column-settings/', headers=headers)
        if response.status_code == 200:
            columns_config = response.json()['columns_config']
            if 'blocked' not in columns_config:
                print("Adding 'blocked' column to settings")
                # Add blocked column if it doesn't exist
                columns_config['blocked'] = {'id': 'blocked', 'title': 'Blocked', 'taskIds': []}
                column_order = response.json()['column_order']
                if 'blocked' not in column_order:
                    column_order.insert(2, 'blocked')  # Insert before 'done'
                
                payload = {
                    'columns_config': json.dumps(columns_config),
                    'column_order': json.dumps(column_order)
                }
                update_response = requests.put(f'{base_url}/api/v1/column-settings/', headers=headers, json=payload)
                assert update_response.status_code == 200, f"Failed to update settings with blocked column: {update_response.status_code}"
            else:
                print("'blocked' column already exists in settings")
        else:
            # Create default settings with blocked column
            print("No column settings found, creating defaults with 'blocked' column")
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
            
            response = requests.put(f'{base_url}/api/v1/column-settings/', headers=headers, json=payload)
            assert response.status_code in [200, 201], f"Failed to create settings with blocked column: {response.status_code}"
    except Exception as e:
        print(f"Error setting up 'blocked' column: {e}")
        assert False, f"Error setting up 'blocked' column: {e}"
    
    # Step 2: Create a todo item with 'blocked' status
    print("\n=== Step 2: Creating a 'blocked' todo ===")
    blocked_todo_payload = {
        "title": "Blocked Todo Item",
        "description": "This is a test todo to verify the blocked column functionality",
        "is_completed": False,
        "status": "blocked"
    }
    
    try:
        response = requests.post(f'{base_url}/api/v1/todos/', headers=headers, json=blocked_todo_payload)
        assert response.status_code == 201, f"Failed to create blocked todo: {response.status_code}"
        todo_id = response.json()['id']
        print(f"Created blocked todo with ID: {todo_id}")
    except Exception as e:
        print(f"Error creating blocked todo: {e}")
        assert False, f"Error creating blocked todo: {e}"
    
    # Step 3: Verify the todo appears in the 'blocked' column
    print("\n=== Step 3: Verifying todo placement in 'blocked' column ===")
    try:
        response = requests.get(f'{base_url}/api/v1/column-settings/', headers=headers)
        assert response.status_code == 200, f"Failed to get column settings: {response.status_code}"
        settings = response.json()
        blocked_column = settings['columns_config']['blocked']
        assert blocked_column, "No 'blocked' column found in settings"
        task_ids = blocked_column['taskIds']
        assert todo_id in task_ids or str(todo_id) in task_ids, f"Todo {todo_id} not found in 'blocked' column tasks: {task_ids}"
        print(f"SUCCESS: Todo {todo_id} correctly appears in 'blocked' column")
    except Exception as e:
        print(f"Error verifying 'blocked' column: {e}")
        assert False, f"Error verifying 'blocked' column: {e}"
    
    # Step 4: Move the todo to a different status
    print("\n=== Step 4: Moving todo to 'inProgress' status ===")
    try:
        update_payload = {
            "status": "inProgress"
        }
        response = requests.patch(f'{base_url}/api/v1/todos/{todo_id}/', headers=headers, json=update_payload)
        assert response.status_code == 200, f"Failed to update todo: {response.status_code}"
        print(f"Updated todo {todo_id} to 'inProgress' status")
    except Exception as e:
        print(f"Error updating todo: {e}")
        assert False, f"Error updating todo: {e}"
    
    # Step 5: Verify the todo moved to the correct column
    print("\n=== Step 5: Verifying todo moved to 'inProgress' column ===")
    try:
        response = requests.get(f'{base_url}/api/v1/column-settings/', headers=headers)
        assert response.status_code == 200, f"Failed to get column settings: {response.status_code}"
        settings = response.json()
        
        # Check todo is NOT in blocked column
        blocked_tasks = settings['columns_config']['blocked']['taskIds']
        assert todo_id not in blocked_tasks and str(todo_id) not in blocked_tasks, f"Todo {todo_id} still found in 'blocked' column tasks"
        
        # Check todo IS in inProgress column
        in_progress_tasks = settings['columns_config']['inProgress']['taskIds']
        assert todo_id in in_progress_tasks or str(todo_id) in in_progress_tasks, f"Todo {todo_id} not found in 'inProgress' column tasks"
        
        print(f"SUCCESS: Todo {todo_id} correctly moved from 'blocked' to 'inProgress' column")
    except Exception as e:
        print(f"Error verifying column movement: {e}")
        assert False, f"Error verifying column movement: {e}"
    
    # Clean up - delete the test todo
    try:
        response = requests.delete(f'{base_url}/api/v1/todos/{todo_id}/', headers=headers)
        assert response.status_code == 204, f"Failed to clean up test todo: {response.status_code}"
        print(f"Cleaned up test todo with ID: {todo_id}")
    except Exception as e:
        print(f"Warning: Error cleaning up test todo: {e}")
