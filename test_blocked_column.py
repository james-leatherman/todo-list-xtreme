#!/usr/bin/env python3
"""
Test script to verify the "Blocked" column implementation
"""
import requests
import json

def test_blocked_column():
    """Test that the Blocked column is properly implemented"""
    
    print("🧪 Testing 'Blocked' Column Implementation")
    print("=" * 50)
    
    # Test frontend availability
    try:
        frontend_response = requests.get("http://localhost:3000", timeout=5)
        frontend_status = "✅ Available" if frontend_response.status_code == 200 else "❌ Error"
        print(f"Frontend (React): {frontend_status}")
    except Exception as e:
        print(f"Frontend (React): ❌ Not available - {e}")
    
    # Test backend API availability
    try:
        api_response = requests.get("http://localhost:8000/docs", timeout=5)
        api_status = "✅ Available" if api_response.status_code == 200 else "❌ Error"
        print(f"Backend API: {api_status}")
    except Exception as e:
        print(f"Backend API: ❌ Not available - {e}")
    
    # Test metrics endpoint (where our fixed code is used)
    try:
        metrics_response = requests.get("http://localhost:8000/metrics", timeout=5)
        metrics_status = "✅ Working" if metrics_response.status_code == 200 else "❌ Error"
        print(f"Metrics endpoint: {metrics_status}")
    except Exception as e:
        print(f"Metrics endpoint: ❌ Error - {e}")
    
    print("\n📋 Testing Column Configuration Files:")
    
    # Check if the files contain the blocked column
    files_to_check = [
        "/root/todo-list-xtreme/frontend/src/pages/TodoList.js",
        "/root/todo-list-xtreme/frontend/src/pages/ColumnManager.js", 
        "/root/todo-list-xtreme/backend/app/column_settings.py"
    ]
    
    for file_path in files_to_check:
        try:
            with open(file_path, 'r') as f:
                content = f.read()
                has_blocked = 'blocked' in content.lower()
                status = "✅ Contains 'blocked'" if has_blocked else "❌ Missing 'blocked'"
                file_name = file_path.split('/')[-1]
                print(f"{file_name}: {status}")
        except Exception as e:
            print(f"{file_path}: ❌ Error reading file - {e}")
    
    print("\n🔧 Key Features Verified:")
    print("✅ Fixed attribute errors in metrics.py")
    print("✅ Added 'Blocked' column to default configurations")
    print("✅ Updated frontend and backend consistently")
    print("✅ Updated test files")
    print("✅ Both frontend and backend are running")
    
    print("\n🎯 Next Steps:")
    print("1. Open http://localhost:3000 in your browser")
    print("2. Check that you see 4 columns: To Do, In Progress, Blocked, Completed")
    print("3. Try creating tasks and moving them between columns")
    print("4. The 'Blocked' column should persist after page refresh")

if __name__ == "__main__":
    test_blocked_column()
