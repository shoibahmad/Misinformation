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

# Import our analyzer and database
from analyzer import MisinformationAnalyzer
from database import SearchHistoryDB

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

# Initialize analyzer and database
try:
    analyzer = MisinformationAnalyzer()
    print("✅ Analyzer initialized successfully")
except Exception as e:
    print(f"⚠️ Warning: Analyzer initialization failed: {e}")
    analyzer = None

try:
    db = SearchHistoryDB()
    print("✅ Database initialized successfully")
except Exception as e:
    print(f"⚠️ Warning: Database initialization failed: {e}")
    db = None

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
                "newsdata_available": False,
                "factcheck_available": False,
                "analyzer_ready": False
            }
        
        # Check which APIs are configured
        gemini_available = bool(os.getenv('GEMINI_API_KEY'))
        newsdata_available = bool(os.getenv('NEWSDATA_API_KEY'))
        factcheck_available = bool(os.getenv('FACTCHECK_API_KEY'))
        
        print(f"📊 API Status: Gemini={gemini_available}, News={newsdata_available}, FactCheck={factcheck_available}")
        
        return {
            "gemini_available": gemini_available,
            "newsdata_available": newsdata_available,
            "factcheck_available": factcheck_available,
            "analyzer_ready": True
        }
    except Exception as e:
        print(f"❌ Error in API status: {e}")
        return {
            "gemini_available": False,
            "newsdata_available": False,
            "factcheck_available": False,
            "analyzer_ready": False,
            "error": str(e)
        }

# Search History Endpoints
@app.get("/history")
async def get_search_history(
    type: Optional[str] = None,
    min_risk: Optional[float] = None,
    max_risk: Optional[float] = None,
    favorites: Optional[bool] = None,
    limit: int = 50
):
    """Get search history with optional filters"""
    try:
        if db is None:
            raise HTTPException(status_code=500, detail="Database not initialized")
        
        history = db.get_search_history(
            limit=limit,
            analysis_type=type,
            min_risk=min_risk,
            max_risk=max_risk,
            favorites_only=favorites or False
        )
        
        return {"status": "success", "history": history}
    except Exception as e:
        print(f"Error getting history: {e}")
        return {"status": "error", "error": str(e)}

@app.get("/history/{search_id}")
async def get_search_details(search_id: int):
    """Get detailed information about a specific search"""
    try:
        if db is None:
            raise HTTPException(status_code=500, detail="Database not initialized")
        
        search = db.get_search_by_id(search_id)
        if not search:
            raise HTTPException(status_code=404, detail="Search not found")
        
        return {"status": "success", "search": search}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting search details: {e}")
        return {"status": "error", "error": str(e)}

@app.post("/history/{search_id}/favorite")
async def toggle_favorite(search_id: int):
    """Toggle favorite status of a search"""
    try:
        if db is None:
            raise HTTPException(status_code=500, detail="Database not initialized")
        
        success = db.toggle_favorite(search_id)
        if not success:
            raise HTTPException(status_code=404, detail="Search not found")
        
        return {"status": "success", "message": "Favorite status updated"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error toggling favorite: {e}")
        return {"status": "error", "error": str(e)}

@app.delete("/history/{search_id}")
async def delete_search(search_id: int):
    """Delete a search from history"""
    try:
        if db is None:
            raise HTTPException(status_code=500, detail="Database not initialized")
        
        success = db.delete_search(search_id)
        if not success:
            raise HTTPException(status_code=404, detail="Search not found")
        
        return {"status": "success", "message": "Search deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting search: {e}")
        return {"status": "error", "error": str(e)}

@app.get("/history/statistics")
async def get_history_statistics():
    """Get search history statistics"""
    try:
        print("📊 Statistics endpoint called")
        if db is None:
            print("❌ Database is None")
            raise HTTPException(status_code=500, detail="Database not initialized")
        
        print("🔍 Getting statistics from database...")
        stats = db.get_statistics()
        print(f"✅ Statistics retrieved: {stats}")
        
        if not stats:
            print("⚠️ No statistics returned from database")
            stats = {
                'total_searches': 0,
                'by_type': {},
                'risk_distribution': {'low': 0, 'medium': 0, 'high': 0},
                'recent_activity': 0
            }
        
        response = {"status": "success", "statistics": stats}
        print(f"📤 Returning response: {response}")
        return response
    except Exception as e:
        print(f"❌ Error getting statistics: {e}")
        import traceback
        traceback.print_exc()
        # Return a default response instead of throwing an error
        return {
            "status": "success", 
            "statistics": {
                'total_searches': 0,
                'by_type': {},
                'risk_distribution': {'low': 0, 'medium': 0, 'high': 0},
                'recent_activity': 0
            }
        }

@app.post("/history/clear")
async def clear_history():
    """Clear all search history"""
    try:
        if db is None:
            raise HTTPException(status_code=500, detail="Database not initialized")
        
        deleted_count = db.clear_history()
        return {"status": "success", "message": f"Cleared {deleted_count} search records"}
    except Exception as e:
        print(f"Error clearing history: {e}")
        return {"status": "error", "error": str(e)}

@app.post("/api/analyze-text")
async def analyze_text(text: str = Form(...)):
    """Comprehensive text analysis for misinformation using multiple APIs"""
    try:
        if analyzer is None:
            raise HTTPException(status_code=500, detail="Analyzer not initialized")
        
        result = await analyzer.analyze_text_comprehensive(text)
        
        # Save to history
        if db is not None:
            try:
                db.add_search(
                    analysis_type="text",
                    content=text,
                    results=result
                )
            except Exception as e:
                print(f"Warning: Failed to save to history: {e}")
        
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
        
        # Save to history
        if db is not None:
            try:
                db.add_search(
                    analysis_type="image",
                    content=file.filename,
                    results=result,
                    file_name=file.filename,
                    file_size=len(content)
                )
            except Exception as e:
                print(f"Warning: Failed to save to history: {e}")
        
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
        
        # Save to history
        if db is not None:
            try:
                db.add_search(
                    analysis_type="video",
                    content=file.filename,
                    results=result,
                    file_name=file.filename,
                    file_size=len(content)
                )
            except Exception as e:
                print(f"Warning: Failed to save to history: {e}")
        
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
            "NEWSDATA_API_KEY": "Set" if os.getenv('NEWSDATA_API_KEY') else "Not set", 
            "FACTCHECK_API_KEY": "Set" if os.getenv('FACTCHECK_API_KEY') else "Not set"
        },
        "port": 3000,
        "status": "running"
    }

if __name__ == "__main__":
    import uvicorn
    PORT = 5000  # Standard Flask port
    print("🚀 Starting CyberGuard AI Detector...")
    print("=" * 60)
    print(f"🌐 Main Application: http://localhost:{PORT}")
    print(f"📝 Text Analysis: http://localhost:{PORT}")
    print(f"🖼️  Image Analysis: http://localhost:{PORT}")
    print(f"🎬 Video Analysis: http://localhost:{PORT}")
    print(f"📚 API Documentation: http://localhost:{PORT}/docs")
    print(f"❤️  Health Check: http://localhost:{PORT}/health")
    print(f"🔧 Debug Info: http://localhost:{PORT}/debug")
    print("=" * 60)
    print("Press Ctrl+C to stop the server")
    print()
    
    try:
        # Use import string for reload to work properly
        uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
    except KeyboardInterrupt:
        print("\n👋 Server stopped. Goodbye!")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        print("💡 Try running: pip install -r requirements.txt")