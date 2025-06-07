#!/usr/bin/env python3
"""Simple test script for column settings API"""

import requests
import json
import sys

# Configuration
BASE_URL = "http://127.0.0.1:8000"

def test_column_settings(auth_token):
    """Test column settings API with simple requests"""
    headers = {"Authorization": f"Bearer {auth_token}"}
    url = f"{BASE_URL}/column-settings"
    
    print(f"Testing GET request to {url}")
    try:
        response = requests.get(url, headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print(f"Response: {json.dumps(response.json(), indent=2)}")
        else:
            print(f"Error content: {response.text}")
    except Exception as e:
        print(f"Request failed: {str(e)}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python simple_test_column_settings.py <auth_token>")
        sys.exit(1)
    
    auth_token = sys.argv[1]
    test_column_settings(auth_token)
