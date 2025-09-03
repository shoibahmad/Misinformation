# 🛡️ AI-Powered Misinformation & Deepfake Detection Tool

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-1.5%20Flash-orange.svg)](https://ai.google.dev)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A comprehensive AI-powered tool for detecting misinformation, fake news, and deepfakes across text, images, and videos. Built with cutting-edge AI technology including Google Gemini 1.5 Flash for expert-level analysis and definitive verdicts.

## 🌟 Features

### 📝 **Text Analysis**
- **AI Expert Verdicts**: Clear classifications (FAKE NEWS, MODERATELY FAKE, LEGITIMATE)
- **Multi-layered Analysis**: Linguistic patterns, sentiment analysis, and AI assessment
- **Fact-checking Integration**: NewsAPI and Google Fact Check Tools API
- **Confidence Scoring**: Detailed confidence percentages for each verdict
- **Real-time Processing**: Fast analysis with comprehensive breakdowns

### 🖼️ **Image Analysis**
- **Deepfake Detection**: Advanced AI-powered manipulation detection
- **Technical Analysis**: Image quality, compression artifacts, and metadata examination
- **Google Gemini Vision**: Expert-level visual analysis for authenticity verification
- **Risk Assessment**: Clear risk levels (High, Medium, Low) with detailed explanations

### 🎬 **Video Analysis**
- **Frame-by-frame Analysis**: Comprehensive deepfake detection across video frames
- **AI-powered Assessment**: Google Gemini analysis for temporal inconsistencies
- **Batch Processing**: Efficient analysis of multiple frames with aggregated results
- **Video Properties**: Duration, FPS, and frame count analysis

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Google Gemini API Key
- NewsAPI Key 
- Google Cloud API Key for Fact Check Tools 

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/shoibahmad/Misinformation.git
   cd Misinformation
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure API Keys**
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   NEWSAPI_KEY=your_newsapi_key_here
   FACTCHECK_API_KEY=your_google_cloud_api_key_here
   ```

4. **Run the application**
   ```bash
   python main.py
   ```

5. **Access the web interface**
   Open your browser and navigate to `http://localhost:8003`

## 🎯 How It Works

### Text Analysis Pipeline
1. **Linguistic Pattern Analysis**: Detects suspicious phrases, emotional manipulation, and bias indicators
2. **Sentiment Analysis**: Evaluates emotional tone and subjectivity
3. **Google Gemini AI**: Provides expert-level analysis with definitive verdicts
4. **Fact-checking**: Cross-references with reliable news sources and fact-checkers
5. **Risk Scoring**: Combines all factors into a comprehensive misinformation score

### Image/Video Analysis Pipeline
1. **Technical Analysis**: Examines image properties, compression, and metadata
2. **AI Visual Analysis**: Google Gemini Vision detects manipulation patterns
3. **Deepfake Detection**: Identifies inconsistencies in lighting, shadows, and facial features
4. **Risk Assessment**: Provides clear risk levels with detailed explanations

## 🔧 API Endpoints

- `POST /api/analyze-text` - Analyze text for misinformation
- `POST /api/analyze-image` - Detect deepfakes in images
- `POST /api/analyze-video` - Analyze videos for manipulation
- `GET /health` - Health check endpoint
- `GET /docs` - Interactive API documentation

## 🎨 User Interface

### Modern Web Interface
- **Dark Theme**: Professional, easy-on-the-eyes design
- **Tabbed Interface**: Separate sections for text, image, and video analysis
- **Real-time Results**: Instant analysis with detailed breakdowns
- **Export Functionality**: Save analysis results as JSON
- **Responsive Design**: Works on desktop and mobile devices

### Key UI Components
- **Risk Assessment Meter**: Visual representation of misinformation risk
- **AI Expert Analysis**: Dedicated section for Gemini AI verdicts
- **Detailed Breakdowns**: Comprehensive analysis sections for each component
- **Recommendations**: Actionable advice based on analysis results

## 🧠 AI Integration

### Google Gemini 1.5 Flash
- **Text Analysis**: Expert-level misinformation detection with clear verdicts
- **Image Analysis**: Advanced deepfake and manipulation detection
- **Video Analysis**: Temporal consistency analysis across frames
- **Confidence Scoring**: Detailed confidence percentages for all assessments

### Multi-API Approach
- **NewsAPI**: Real-time news verification and source reliability checking
- **Google Fact Check Tools**: Professional fact-checking database integration
- **Fallback Mechanisms**: Robust error handling and alternative analysis methods

## �  Analysis Results

### Text Analysis Output
```json
{
  "misinformation_score": 0.85,
  "confidence": 0.92,
  "analysis": {
    "gemini_analysis": {
      "fake_news_verdict": "FAKE NEWS",
      "confidence": 87,
      "analysis": "Detailed AI analysis..."
    },
    "linguistic_patterns": {...},
    "sentiment": {...},
    "fact_check": {...},
    "news_verification": {...}
  },
  "recommendations": [...]
}
```

### Image/Video Analysis Output
```json
{
  "deepfake_risk": "high",
  "ai_analysis": "Detailed Gemini analysis...",
  "technical_analysis": {...},
  "recommendations": [...]
}
```

## 🛠️ Technical Stack

- **Backend**: FastAPI (Python)
- **AI Engine**: Google Gemini 1.5 Flash
- **Computer Vision**: OpenCV, PIL
- **Text Processing**: TextBlob, NLTK
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **APIs**: NewsAPI, Google Fact Check Tools API
- **Deployment**: Uvicorn ASGI server

## 🔒 Security & Privacy

- **Local Processing**: All analysis performed locally on your server
- **API Key Security**: Environment variable configuration for sensitive keys
- **No Data Storage**: Temporary files are automatically cleaned up
- **HTTPS Ready**: Production-ready security configurations

## 📈 Performance

- **Fast Analysis**: Optimized algorithms for quick results
- **Concurrent Processing**: Async/await for efficient API calls
- **Memory Efficient**: Automatic cleanup of temporary files
- **Scalable Architecture**: Ready for production deployment

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** for advanced AI analysis capabilities
- **NewsAPI** for real-time news verification
- **OpenCV Community** for computer vision tools
- **FastAPI** for the excellent web framework

## 📞 Support

- 📧 Email: shoibsahmad@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/shoibahmad/Misinformation/issues)
- 📖 Documentation: [Wiki](https://github.com/yourusername/Misinformation/wiki)

## 🔮 Roadmap

- [ ] Real-time URL analysis
- [ ] Batch processing capabilities
- [ ] Advanced reporting dashboard
- [ ] Mobile app development
- [ ] Multi-language support
- [ ] API rate limiting and authentication
- [ ] Machine learning model training interface

---

**⚠️ Disclaimer**: This tool is designed to assist in identifying potential misinformation and deepfakes. Always verify important information through multiple reliable sources and use critical thinking when evaluating content.

**🌟 Star this repository if you find it useful!**
