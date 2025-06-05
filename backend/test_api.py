import requests
import json
import sys

def test_api_endpoints():
    # Configuration
    base_url = "http://localhost:8000"
    
    # Use the test token we generated
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZXhwIjoxNzQ5MTcyMzExfQ.Xwo6PVcoIgchrd3rWlBDKMWofs18yx0QUqzX0CSefLE"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Health check (no auth required)
    print("\n1. Testing health endpoint...")
    resp = requests.get(f"{base_url}/health")
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.json()}")
    
    # Auth check
    print("\n2. Testing auth/me endpoint...")
    resp = requests.get(f"{base_url}/auth/me/", headers=headers)
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.json() if resp.status_code == 200 else resp.text}")
    
    # Get all todos
    print("\n3. Testing get todos endpoint...")
    resp = requests.get(f"{base_url}/todos/", headers=headers)
    print(f"Status: {resp.status_code}")
    todos = resp.json() if resp.status_code == 200 else []
    print(f"Found {len(todos)} todos")
    
    # Create a todo
    print("\n4. Testing create todo endpoint...")
    new_todo = {
        "title": "Test API Integration",
        "description": "Testing that the API and frontend work together"
    }
    resp = requests.post(f"{base_url}/todos/", headers=headers, json=new_todo)
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.json() if resp.status_code in [200, 201] else resp.text}")
    
    # Get todo by ID (using the one we just created)
    if resp.status_code in [200, 201]:
        todo_id = resp.json().get("id")
        print(f"\n5. Testing get todo by ID endpoint (ID: {todo_id})...")
        resp = requests.get(f"{base_url}/todos/{todo_id}/", headers=headers)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.json() if resp.status_code == 200 else resp.text}")
        
        # Update the todo
        print(f"\n6. Testing update todo endpoint (ID: {todo_id})...")
        update_data = {
            "title": "Updated Test Todo",
            "description": "This todo was updated via API test",
            "is_completed": True
        }
        resp = requests.put(f"{base_url}/todos/{todo_id}/", headers=headers, json=update_data)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.json() if resp.status_code == 200 else resp.text}")
    
    # Create sample todos
    print("\n7. Testing create sample todos endpoint...")
    resp = requests.post(f"{base_url}/todos/test/create-sample-todos/", headers=headers)
    print(f"Status: {resp.status_code}")
    sample_todos = resp.json() if resp.status_code == 200 else []
    print(f"Created {len(sample_todos)} sample todos")
    
    print("\nAPI testing complete!")

if __name__ == "__main__":
    test_api_endpoints()
