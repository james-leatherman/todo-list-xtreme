#!/usr/bin/env python3
"""
Test script for column persistence with empty columns
"""
import json
import requests
import sys
import pytest

def test_empty_column_persistence(auth_token):
    """Test that empty columns are persisted"""
    base_url = 'http://localhost:8000'
    headers = {'Authorization': f'Bearer {auth_token}'}
    
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
    except Exception as e:
        print(f"Error saving settings: {e}")
        assert False, f"Error saving settings: {e}"
    # Get settings
    try:
        response = requests.get(
            f'{base_url}/api/v1/column-settings/',
            headers=headers
        )
        assert response.status_code == 200, f"FAILED: Could not retrieve settings: {response.status_code}\n{response.text}"
        settings = response.json()
        retrieved_columns = settings['columns_config']
        retrieved_order = settings['column_order']
        assert 'empty-test' in retrieved_columns, "FAILED: Empty test column NOT found in retrieved data"
        position = retrieved_order.index('empty-test') if 'empty-test' in retrieved_order else -1
        assert position == 4, f"WARNING: Column order changed, expected at position 4, found at {position}"
        print("SUCCESS: Empty test column found in retrieved data")
        print(f"SUCCESS: Empty test column found at position {position} in column order")
        print("SUCCESS: Column order correctly preserved")
    except Exception as e:
        print(f"Error retrieving settings: {e}")
        assert False, f"Error retrieving settings: {e}"
    
    # Verify column order
    print("\n=== Step 3: Verifying column order ===")
    try:
        response = requests.get(f'{base_url}/api/v1/column-settings/', headers=headers)
        assert response.status_code == 200, f"Failed to get column settings: {response.status_code}\n{response.text}"
        settings = response.json()
        retrieved_order = settings['column_order']
        assert retrieved_order == test_column_order, f"Expected column order: {test_column_order}, Got: {retrieved_order}"
        print("SUCCESS: Column order is correct")
    except Exception as e:
        print(f"Error verifying column order: {e}")
        assert False, f"Error verifying column order: {e}"
