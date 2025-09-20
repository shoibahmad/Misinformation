#!/usr/bin/env python3
"""
TruthGuard AI - Startup Script
Starts the server on port 8005 with enhanced debugging
"""

import os
import sys
import subprocess
import time

def main():
    print("🚀 TruthGuard AI - Enhanced Startup Script")
    print("=" * 60)
    print("🔧 Port: 8005 (Changed from 8003 to avoid conflicts)")
    print("🧪 Progress Indicators: Enhanced with debugging")
    print("📊 Test Page: http://localhost:8005/test_progress.html")
    print("=" * 60)
    
    # Check if required files exist
    required_files = [
        "main.py",
        "static/index.html", 
        "static/script.js",
        "static/style.css"
    ]
    
    missing_files = []
    for file in required_files:
        if not os.path.exists(file):
            missing_files.append(file)
    
    if missing_files:
        print("❌ Missing required files:")
        for file in missing_files:
            print(f"   - {file}")
        return 1
    
    print("✅ All required files found")
    print("🔄 Starting server...")
    print()
    
    try:
        # Start the server
        subprocess.run([sys.executable, "main.py"], check=True)
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
        return 0
    except subprocess.CalledProcessError as e:
        print(f"❌ Server failed to start: {e}")
        return 1
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())