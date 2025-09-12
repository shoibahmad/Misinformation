# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Overview

This is an AI-powered misinformation and deepfake detection tool built with FastAPI, Google Gemini AI, and various fact-checking APIs. The application analyzes text for fake news, images for deepfakes, and videos for manipulation using advanced AI models and technical analysis.

## Common Development Commands

### Environment Setup
```bash
# Create and activate virtual environment
python -m venv venv
# Windows
venv\Scripts\activate
# Unix/macOS  
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Running the Application
```bash
# Main server (automatic port detection)
python main.py

# Smart server with port conflict resolution
python start_server.py

# Kill processes using specific ports (Windows)
.\kill_port8000.bat
python kill_port.py
```

### Testing
```bash
# Run test suite
python test_app.py

# Test specific endpoints manually
curl http://localhost:5000/health
curl http://localhost:5000/api/status
```

### Configuration
```bash
# Set up environment variables in .env file
GEMINI_API_KEY=your_gemini_api_key_here
NEWSDATA_API_KEY=your_newsdata_api_key_here
FACTCHECK_API_KEY=your_google_cloud_api_key_here
```

## Architecture Overview

### Backend Architecture (FastAPI)
- **`main.py`**: FastAPI application entry point with API endpoints
- **`analyzer.py`**: Core analysis engine with AI integration and multiple analysis methods
- **`start_server.py`**: Smart server startup with automatic port detection

### Frontend Architecture (Vanilla JS SPA)
- **`static/index.html`**: Single-page application with tabbed interface
- **`static/script.js`**: Client-side logic with welcome screen and analysis handling
- **`static/style.css`**: Modern CSS with dark mode support and animations

### Key Components

#### MisinformationAnalyzer Class
- **Text Analysis**: Combines linguistic patterns, sentiment analysis, Google Gemini AI, fact-checking APIs, and news verification
- **Image Analysis**: Uses Google Gemini Pro Vision for deepfake detection with technical image analysis
- **Video Analysis**: Frame-by-frame analysis using OpenCV and Gemini AI for temporal consistency

#### API Integration Strategy
- **Google Gemini 1.5 Flash**: Primary AI analysis engine with fallback to older models
- **NewsData.io API**: Real-time news verification and source reliability checking
- **Google Fact Check Tools API**: Professional fact-checking database integration
- **Graceful Degradation**: Application continues to function with partial API availability

### Analysis Pipeline Architecture

#### Text Analysis Flow
1. **Linguistic Pattern Detection**: Suspicious phrases, emotional manipulation, urgency indicators
2. **Sentiment Analysis**: Using TextBlob for polarity and subjectivity
3. **Google Gemini Analysis**: Expert-level AI analysis with clear verdicts (FAKE NEWS/MODERATELY FAKE/LEGITIMATE)
4. **Fact-checking Integration**: Cross-reference with Google Fact Check Tools API
5. **News Verification**: Validate against reliable news sources via NewsData.io
6. **Risk Scoring**: Weighted combination of all analysis components

#### Image/Video Analysis Flow
1. **Technical Analysis**: Image properties, compression artifacts, quality metrics using OpenCV/PIL
2. **AI Visual Analysis**: Google Gemini Vision for manipulation pattern detection
3. **Deepfake Risk Assessment**: Conservative approach with evidence-based scoring
4. **Video Frame Sampling**: Intelligent frame selection for temporal consistency analysis

## Key Design Patterns

### Error Handling Strategy
- **API Fallbacks**: Graceful degradation when services are unavailable
- **Conservative Analysis**: Default to lower risk scores when uncertain
- **Comprehensive Error Logging**: Detailed console output for debugging

### File Management
- **Temporary File Handling**: Automatic cleanup with retry mechanisms for Windows
- **UUID-based Naming**: Prevents conflicts during concurrent uploads
- **Memory Efficiency**: Streaming and immediate cleanup of large files

### Frontend State Management
- **Tab-based Navigation**: Clean separation of analysis types
- **Real-time Feedback**: Loading states and progress indicators
- **Responsive Design**: Mobile-friendly with touch interactions

## Development Guidelines

### Adding New Analysis Methods
1. Extend the `MisinformationAnalyzer` class in `analyzer.py`
2. Add corresponding API endpoint in `main.py`
3. Update frontend in `static/script.js` and add UI elements
4. Follow the established error handling and logging patterns

### API Integration Best Practices
- Always implement graceful fallbacks for external APIs
- Use conservative risk assessment when APIs are unavailable
- Log API response status and errors for debugging
- Respect rate limits and implement appropriate delays

### Testing New Features
- Test with various file types and sizes
- Verify behavior when APIs are unavailable
- Check error handling edge cases
- Validate temporary file cleanup

### Code Organization Principles
- **Single Responsibility**: Each analysis method handles one specific task
- **Async/Await**: All API calls use async patterns for better performance
- **Configuration Management**: Environment variables for all external dependencies
- **Modular Design**: Clear separation between analysis logic and API endpoints

## Common Issues and Solutions

### Port Conflicts
- Use `start_server.py` for automatic port detection
- Run `kill_port.py` or `kill_port8000.bat` to clear blocked ports

### API Configuration Issues
- Check `.env` file for proper API keys
- Verify API key permissions and quotas
- Use `/api/status` endpoint to diagnose API availability

### File Upload Problems
- Ensure proper MIME type validation
- Check file size limits (10MB for images/videos)
- Verify temporary directory write permissions

### Performance Optimization
- Video analysis samples frames intelligently (max 5 frames)
- Image analysis uses conservative technical thresholds
- Text analysis limits query lengths to prevent API timeouts

## Security Considerations

- **No Data Persistence**: All analysis is performed in-memory with immediate cleanup
- **Input Validation**: Strict file type and size checking
- **API Key Management**: Environment variable configuration only
- **Temporary File Security**: UUID-based naming and automatic cleanup

## Extending the Application

### Adding New AI Models
1. Update the model initialization logic in `MisinformationAnalyzer.__init__()`
2. Add fallback mechanisms for model failures
3. Update the scoring algorithms to incorporate new model outputs

### New Analysis Types
1. Create new analysis methods following the existing async patterns
2. Add corresponding API endpoints with proper error handling
3. Update the frontend with new tabs and UI components
4. Ensure proper cleanup and resource management
