#!/usr/bin/env python3
"""
Smart server startup script for the AI Misinformation & Deepfake Detection Tool
Automatically handles port conflicts and finds available ports
"""

import uvicorn
import socket
import sys
from main import app

def find_available_port(start_port=8000, max_attempts=10):
    """Find an available port starting from start_port"""
    for port in range(start_port, start_port + max_attempts):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('localhost', port))
                return port
        except OSError:
            continue
    
    raise RuntimeError(f"No available ports found in range {start_port}-{start_port + max_attempts}")

def kill_existing_process(port):
    """Kill any existing process using the specified port"""
    import subprocess
    import os
    
    try:
        if os.name == 'nt':  # Windows
            result = subprocess.run(['netstat', '-ano'], capture_output=True, text=True)
            lines = result.stdout.split('\n')
            
            for line in lines:
                if f':{port}' in line and 'LISTENING' in line:
                    parts = line.split()
                    if len(parts) >= 5:
                        pid = parts[-1]
                        if pid.isdigit():
                            subprocess.run(['taskkill', '/PID', pid, '/F'], check=True)
                            print(f"🧹 Killed existing process {pid} on port {port}")
                            return True
        return False
    except Exception:
        return False

if __name__ == "__main__":
    DEFAULT_PORT = 8000
    
    print("🚀 Starting AI-Powered Misinformation & Deepfake Detection Tool...")
    print("=" * 70)
    
    # Try to find an available port
    try:
        port = find_available_port(DEFAULT_PORT)
        
        if port != DEFAULT_PORT:
            print(f"⚠️  Port {DEFAULT_PORT} is busy, using port {port}")
        else:
            print(f"✅ Using port {DEFAULT_PORT}")
        
    except RuntimeError as e:
        print(f"❌ {e}")
        print("💡 Try a different port or kill existing processes")
        sys.exit(1)
    
    print(f"🌐 Main Interface: http://localhost:{port}")
    print(f"🔍 API Status: http://localhost:{port}/api/status")
    print(f"🧪 Debug Info: http://localhost:{port}/debug")
    print(f"📚 API Documentation: http://localhost:{port}/docs")
    print(f"❤️  Health Check: http://localhost:{port}/health")
    print("=" * 70)
    print("🎯 Open http://localhost:{} in your browser to start!".format(port))
    print("Press Ctrl+C to stop the server")
    print()
    
    try:
        uvicorn.run(
            app, 
            host="0.0.0.0", 
            port=port, 
            reload=False,  # Disable reload to prevent issues
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n👋 Server stopped. Goodbye!")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        print("💡 Make sure all dependencies are installed: pip install -r requirements.txt")