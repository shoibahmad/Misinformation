#!/usr/bin/env python3
"""
Simple test script to verify the CyberGuard AI application functionality
"""

import requests
import json
import time

def test_api_status():
    """Test the API status endpoint"""
    try:
        response = requests.get('http://localhost:5000/api/status')
        if response.status_code == 200:
            data = response.json()
            print("✅ API Status Test Passed")
            print(f"   Gemini Available: {data.get('gemini_available', False)}")
            print(f"   NewsData Available: {data.get('newsdata_available', False)}")
            print(f"   FactCheck Available: {data.get('factcheck_available', False)}")
            print(f"   Analyzer Ready: {data.get('analyzer_ready', False)}")
            return True
        else:
            print(f"❌ API Status Test Failed: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ API Status Test Failed: {e}")
        return False

def test_health_check():
    """Test the health check endpoint"""
    try:
        response = requests.get('http://localhost:5000/health')
        if response.status_code == 200:
            data = response.json()
            print("✅ Health Check Test Passed")
            print(f"   Status: {data.get('status', 'unknown')}")
            return True
        else:
            print(f"❌ Health Check Test Failed: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health Check Test Failed: {e}")
        return False

def test_history_endpoints():
    """Test the history endpoints"""
    try:
        # Test getting empty history
        response = requests.get('http://localhost:5000/history')
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'success':
                print("✅ History Endpoint Test Passed")
                print(f"   History Count: {len(data.get('history', []))}")
                return True
            else:
                print(f"❌ History Endpoint Test Failed: {data.get('error', 'Unknown error')}")
                return False
        else:
            print(f"❌ History Endpoint Test Failed: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ History Endpoint Test Failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting CyberGuard AI Tests...")
    print("=" * 50)
    
    # Wait a moment for server to be ready
    print("⏳ Waiting for server to be ready...")
    time.sleep(2)
    
    tests = [
        ("Health Check", test_health_check),
        ("API Status", test_api_status),
        ("History Endpoints", test_history_endpoints),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n🧪 Running {test_name} Test...")
        if test_func():
            passed += 1
        print("-" * 30)
    
    print(f"\n📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! CyberGuard AI is working correctly.")
    else:
        print("⚠️  Some tests failed. Please check the server logs.")

if __name__ == "__main__":
    main()