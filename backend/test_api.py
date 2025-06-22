#!/usr/bin/env python3
"""
Test the FastAPI endpoints to ensure they work properly
"""

import requests
import json

API_BASE = "http://localhost:8000"

def test_api_endpoints():
    """Test various API endpoints"""
    print("🧪 Testing FastAPI endpoints...")
    
    # Test 1: Health check
    try:
        response = requests.get(f"{API_BASE}/health")
        print(f"✅ Health check: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"❌ Health check failed: {e}")
    
    # Test 2: Root endpoint
    try:
        response = requests.get(f"{API_BASE}/")
        print(f"✅ Root endpoint: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"❌ Root endpoint failed: {e}")
    
    # Test 3: Try to get users (the endpoint that was failing)
    try:
        response = requests.get(f"{API_BASE}/api/v1/users/?skip=0&limit=100&role=student")
        print(f"✅ Users endpoint: {response.status_code}")
        if response.status_code == 200:
            users = response.json()
            print(f"   📋 Found {len(users)} users")
            if users:
                print(f"   👤 Sample user: {users[0]['name']} ({users[0]['role']})")
        else:
            print(f"   ❌ Error: {response.text}")
    except Exception as e:
        print(f"❌ Users endpoint failed: {e}")
    
    # Test 4: Test demo login
    try:
        login_data = {
            "email": "admin@demo.com",
            "password": "demo123"
        }
        response = requests.post(f"{API_BASE}/api/v1/auth/login", json=login_data)
        print(f"✅ Login endpoint: {response.status_code}")
        if response.status_code == 200:
            token_data = response.json()
            print(f"   🔑 Login successful for: {token_data['user']['name']}")
        else:
            print(f"   ❌ Login failed: {response.text}")
    except Exception as e:
        print(f"❌ Login endpoint failed: {e}")

if __name__ == "__main__":
    test_api_endpoints()
