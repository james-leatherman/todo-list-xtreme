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
