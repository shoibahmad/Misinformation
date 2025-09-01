from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import io
import base64
from typing import Dict, Any, Optional
import asyncio

# Import our analyzer
from analyzer import MisinformationAnalyzer

app = FastAPI(
    title="AI-Powered Misinformation & Deepfake Detection Tool",
    description="Comprehensive detection of misinformation in text, deepfakes in images/videos using multiple APIs",
    version="2.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Initialize analyzer
try:
    analyzer = MisinformationAnalyzer()
    print("✅ Analyzer initialized successfully")
except Exception as e:
    print(f"⚠️ Warning: Analyzer initialization failed: {e}")
    analyzer = None

# Pydantic models
class TextAnalysisRequest(BaseModel):
    text: str
    check_sources: bool = True
    analyze_sentiment: bool = True

class TextAnalysisResponse(BaseModel):
    text: str
    misinformation_score: float
    confidence: float
    analysis: Dict[str, Any]
    recommendations: list[str]

@app.get("/")
async def root():
    """Serve the main HTML page"""
    return FileResponse("static/index.html")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "AI Misinformation Detector is running"}

@app.get("/api/status")
async def get_api_status():
    """Get the status of all configured APIs"""
    try:
        print("🔍 API Status endpoint called")
        
        if analyzer is None:
            print("⚠️ Analyzer is None")
            return {
                "gemini_available": False,
                "newsapi_available": False,
                "factcheck_available": False,
                "analyzer_ready": False
            }
        
        # Check which APIs are configured
        gemini_available = bool(os.getenv('GEMINI_API_KEY'))
        newsapi_available = bool(os.getenv('NEWSAPI_KEY'))
        factcheck_available = bool(os.getenv('FACTCHECK_API_KEY'))
        
        print(f"📊 API Status: Gemini={gemini_available}, News={newsapi_available}, FactCheck={factcheck_available}")
        
        return {
            "gemini_available": gemini_available,
            "newsapi_available": newsapi_available,
            "factcheck_available": factcheck_available,
            "analyzer_ready": True
        }
    except Exception as e:
        print(f"❌ Error in API status: {e}")
        return {
            "gemini_available": False,
            "newsapi_available": False,
            "factcheck_available": False,
            "analyzer_ready": False,
            "error": str(e)
        }

@app.post("/api/analyze-text")
async def analyze_text(text: str = Form(...)):
    """Comprehensive text analysis for misinformation using multiple APIs"""
    try:
        if analyzer is None:
            raise HTTPException(status_code=500, detail="Analyzer not initialized")
        
        result = await analyzer.analyze_text_comprehensive(text)
        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"Text analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/api/analyze-image")
async def analyze_image(file: UploadFile = File(...)):
    """Analyze image for deepfakes and manipulation using Google Gemini Pro"""
    import time
    import uuid
    
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Create unique temporary filename to avoid conflicts
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
        temp_path = f"temp_{uuid.uuid4().hex}.{file_extension}"
        
        # Save uploaded file temporarily
        content = await file.read()
        with open(temp_path, "wb") as buffer:
            buffer.write(content)
        
        # Analyze image
        result = await analyzer.analyze_image_deepfake(temp_path)
        
        # Clean up with retry mechanism for Windows
        max_retries = 3
        for attempt in range(max_retries):
            try:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
                break
            except PermissionError:
                if attempt < max_retries - 1:
                    time.sleep(0.1)  # Wait a bit and retry
                else:
                    print(f"Warning: Could not delete temporary file {temp_path}")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        # Clean up on error
        if 'temp_path' in locals():
            try:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
            except:
                pass  # Ignore cleanup errors
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze-video")
async def analyze_video(file: UploadFile = File(...)):
    """Analyze video for deepfakes and manipulation"""
    import time
    import uuid
    
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith('video/'):
            raise HTTPException(status_code=400, detail="File must be a video")
        
        # Create unique temporary filename to avoid conflicts
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'mp4'
        temp_path = f"temp_{uuid.uuid4().hex}.{file_extension}"
        
        # Save uploaded file temporarily
        content = await file.read()
        with open(temp_path, "wb") as buffer:
            buffer.write(content)
        
        # Analyze video
        result = await analyzer.analyze_video_deepfake(temp_path)
        
        # Clean up with retry mechanism for Windows
        max_retries = 3
        for attempt in range(max_retries):
            try:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
                break
            except PermissionError:
                if attempt < max_retries - 1:
                    time.sleep(0.1)  # Wait a bit and retry
                else:
                    print(f"Warning: Could not delete temporary file {temp_path}")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        # Clean up on error
        if 'temp_path' in locals():
            try:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
            except:
                pass  # Ignore cleanup errors
        raise HTTPException(status_code=500, detail=str(e))

# Legacy endpoint for backward compatibility
@app.post("/api/analyze")
async def analyze_legacy(request: TextAnalysisRequest):
    """Legacy text analysis endpoint"""
    return await analyze_text(request.text)

@app.get("/api/models")
async def get_models():
    return {"models": ["basic-analyzer"], "status": "ready", "analyzer_ready": analyzer is not None}

@app.get("/api/test")
async def test_endpoint():
    """Simple test endpoint"""
    return {"message": "API is working", "status": "ok", "port": "3000"}

@app.get("/debug")
async def debug_info():
    """Debug information endpoint"""
    import sys
    return {
        "python_version": sys.version,
        "analyzer_status": analyzer is not None,
        "env_vars": {
            "GEMINI_API_KEY": "Set" if os.getenv('GEMINI_API_KEY') else "Not set",
            "NEWSAPI_KEY": "Set" if os.getenv('NEWSAPI_KEY') else "Not set", 
            "FACTCHECK_API_KEY": "Set" if os.getenv('FACTCHECK_API_KEY') else "Not set"
        },
        "port": 3000,
        "status": "running"
    }

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting CyberGuard AI Detector...")
    print("=" * 60)
    print("🌐 Main Application: http://localhost:3000")
    print("📝 Text Analysis: http://localhost:3000")
    print("🖼️  Image Analysis: http://localhost:3000")
    print("🎬 Video Analysis: http://localhost:3000")
    print("📚 API Documentation: http://localhost:3000/docs")
    print("❤️  Health Check: http://localhost:3000/health")
    print("🔧 Debug Info: http://localhost:3000/debug")
    print("=" * 60)
    print("Press Ctrl+C to stop the server")
    print()
    
    try:
        # Use import string for reload to work properly
        uvicorn.run("main:app", host="0.0.0.0", port=3000, reload=True)
    except KeyboardInterrupt:
        print("\n👋 Server stopped. Goodbye!")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        print("💡 Try running: pip install -r requirements.txt")