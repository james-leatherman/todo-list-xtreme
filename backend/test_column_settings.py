#!/usr/bin/env python3
# filepath: /root/todo-list-xtreme/backend/test_column_settings.py

import requests
import json
import sys

"""
This script tests the column settings API endpoints.
It requires a valid authentication token to be provided.
"""

# Configuration
BASE_URL = "http://localhost:8000"
AUTH_TOKEN = None  # Will be set from command line argument

# API endpoints
COLUMN_SETTINGS_URL = f"{BASE_URL}/column-settings"

def test_column_settings(auth_token):
    """Test CRUD operations for column settings"""
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    # Test data
    test_columns = {
        'todo': { 'id': 'todo', 'title': 'To Do', 'taskIds': [] },
        'inProgress': { 'id': 'inProgress', 'title': 'In Progress', 'taskIds': [] },
        'done': { 'id': 'done', 'title': 'Done', 'taskIds': [] },
        'custom': { 'id': 'custom', 'title': 'Custom Column', 'taskIds': [] }
    }
    test_column_order = ['todo', 'inProgress', 'custom', 'done']
    
    # Create test payload
    payload = {
        "columns_config": json.dumps(test_columns),
        "column_order": json.dumps(test_column_order)
    }
    
    print("1. Testing GET column settings (should create default if not exist)...")
    response = requests.get(COLUMN_SETTINGS_URL, headers=headers)
    print(f"Status code: {response.status_code}")
    if response.status_code == 200:
        print("Success! Received column settings from API.")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    else:
        print(f"Error: {response.text}")
    
    print("\n2. Testing PUT column settings (update)...")
    response = requests.put(COLUMN_SETTINGS_URL, json=payload, headers=headers)
    print(f"Status code: {response.status_code}")
    if response.status_code == 200:
        print("Success! Column settings updated.")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    else:
        print(f"Error: {response.text}")
        
        # Try creating if updating failed
        print("\n3. Testing POST column settings (create)...")
        response = requests.post(COLUMN_SETTINGS_URL, json=payload, headers=headers)
        print(f"Status code: {response.status_code}")
        if response.status_code == 201:
            print("Success! Column settings created.")
            print(f"Response: {json.dumps(response.json(), indent=2)}")
        else:
            print(f"Error: {response.text}")
    
    # Verify settings were saved
    print("\n4. Verifying column settings were saved...")
    response = requests.get(COLUMN_SETTINGS_URL, headers=headers)
    if response.status_code == 200:
        data = response.json()
        saved_columns = json.loads(data["columns_config"]) if data["columns_config"] else None
        saved_order = json.loads(data["column_order"]) if data["column_order"] else None
        
        if (saved_columns and "custom" in saved_columns and 
            saved_order and "custom" in saved_order):
            print("Success! Verified custom column was saved.")
        else:
            print("Error: Custom column not found in saved settings.")
            print(f"Saved columns: {saved_columns}")
            print(f"Saved order: {saved_order}")
    else:
        print(f"Error: {response.text}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python test_column_settings.py <auth_token>")
        sys.exit(1)
        
    auth_token = sys.argv[1]
    test_column_settings(auth_token)
