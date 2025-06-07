#!/usr/bin/env python3
"""
Test script for column persistence with empty columns
"""
import json
import requests
import sys

def test_empty_column_persistence(auth_token):
    """Test that empty columns are persisted"""
    base_url = 'http://localhost:8000'
    headers = {'Authorization': f'Bearer {auth_token}'}
    
    # Define a test column with no tasks
    test_columns = {
        'todo': {'id': 'todo', 'title': 'To Do', 'taskIds': []},
        'inProgress': {'id': 'inProgress', 'title': 'In Progress', 'taskIds': []},
        'done': {'id': 'done', 'title': 'Completed', 'taskIds': []},
        'empty-test': {'id': 'empty-test', 'title': 'Empty Test Column', 'taskIds': []}
    }
    test_column_order = ['todo', 'inProgress', 'empty-test', 'done']
    
    # Save settings
    settings_payload = {
        'columns_config': json.dumps(test_columns),
        'column_order': json.dumps(test_column_order)
    }
    
    # Try to update first
    try:
        response = requests.put(
            f'{base_url}/column-settings',
            headers=headers,
            json=settings_payload
        )
        print(f"Update response: {response.status_code}")
        if response.status_code != 200:
            # If update fails, try to create
            response = requests.post(
                f'{base_url}/column-settings',
                headers=headers,
                json=settings_payload
            )
            print(f"Create response: {response.status_code}")
    except Exception as e:
        print(f"Error saving settings: {e}")
        return False
    
    # Get settings
    try:
        response = requests.get(
            f'{base_url}/column-settings',
            headers=headers
        )
        
        if response.status_code == 200:
            settings = response.json()
            retrieved_columns = json.loads(settings['columns_config'])
            retrieved_order = json.loads(settings['column_order'])
            
            # Check if the empty column exists in the retrieved data
            if 'empty-test' in retrieved_columns:
                print("SUCCESS: Empty test column found in retrieved data")
            else:
                print("FAILED: Empty test column NOT found in retrieved data")
                return False
                
            # Check if column order is preserved
            if 'empty-test' in retrieved_order:
                position = retrieved_order.index('empty-test')
                print(f"SUCCESS: Empty test column found at position {position} in column order")
                if position == 2:  # We put it at index 2 above
                    print("SUCCESS: Column order correctly preserved")
                else:
                    print(f"WARNING: Column order changed, expected at position 2, found at {position}")
            else:
                print("FAILED: Empty test column NOT found in retrieved column order")
                return False
                
            return True
        else:
            print(f"FAILED: Could not retrieve settings: {response.status_code}")
            print(response.text)
            return False
    except Exception as e:
        print(f"Error retrieving settings: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <auth_token>")
        sys.exit(1)
        
    auth_token = sys.argv[1]
    success = test_empty_column_persistence(auth_token)
    
    if success:
        print("Test passed! Empty columns are persisted correctly.")
        sys.exit(0)
    else:
        print("Test failed! Empty columns are not persisted correctly.")
        sys.exit(1)
