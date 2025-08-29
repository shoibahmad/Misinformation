#!/usr/bin/env python3
"""
Simple server startup script for the AI Misinformation & Deepfake Detection Tool
"""

import uvicorn
from main import app

if __name__ == "__main__":
    print("🚀 Starting AI-Powered Misinformation & Deepfake Detection Tool...")
    print("=" * 60)
    print("🌐 Server: http://localhost:8003")
    print("📚 API Documentation: http://localhost:8003/docs")
    print("❤️  Health Check: http://localhost:8003/health")
    print("=" * 60)
    print("Press Ctrl+C to stop the server")
    print()
    
    try:
        uvicorn.run(
            app, 
            host="0.0.0.0", 
            port=8003, 
            reload=False,  # Disable reload to prevent issues
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n👋 Server stopped. Goodbye!")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        print("💡 Make sure all dependencies are installed: pip install -r requirements.txt")