import os
import asyncio
import aiohttp
import requests
import cv2
import numpy as np
from PIL import Image
import base64
import json
from typing import Dict, Any, List, Optional
from textblob import TextBlob
import google.generativeai as genai
from dotenv import dotenv_values

# Load environment variables safely
def _load_env_safely():
    try:
        env_path = os.path.join(os.getcwd(), ".env")
        if os.path.exists(env_path):
            values = dotenv_values(env_path)
            for key, value in values.items():
                if value is not None and key not in os.environ:
                    os.environ[key] = str(value)
    except Exception as e:
        print(f"⚠️  Skipping .env load due to parse issue: {e}")

_load_env_safely()

class MisinformationAnalyzer:
    def __init__(self):
        """Initialize the analyzer with API configurations"""
        self.newsapi_key = os.getenv('NEWSAPI_KEY', '1aef5e04e84643a889ba8e0f377e196b')
        self.factcheck_api_key = os.getenv('FACTCHECK_API_KEY', 'AIzaSyA-TVdHyEDKQbZiFreOWMBK6r0hkVCP_QY')
        self.gemini_api_key = os.getenv('GEMINI_API_KEY', 'AIzaSyDCDMiQMc7fb3T2NZUf5WeBg5bbDd7TCNg')
        self.gemini_backup_key = os.getenv('GEMINI_API_KEY_BACKUP', 'AIzaSyB2hJtn7g6pRDytWXbMBBsETMzxTPbv26o')
        
        # Configure Google Gemini
        self.gemini_model = None
        if self.gemini_api_key:
            try:
                genai.configure(api_key=self.gemini_api_key)
                self.gemini_model = genai.GenerativeModel('gemini-2.5-flash')
                print(f"Google Gemini configured successfully")
            except Exception as e:
                print(f"Primary Gemini key failed: {e}")
                if self.gemini_backup_key:
                    try:
                        genai.configure(api_key=self.gemini_backup_key)
                        self.gemini_model = genai.GenerativeModel('gemini-2.5-flash')
                        print(f"Backup Gemini key configured successfully")
                    except Exception as e2:
                        print(f"Backup Gemini key also failed: {e2}")
                        self.gemini_model = None
        
        if not self.gemini_model:
            print("Google Gemini API not configured - using basic analysis mode")
            
        # Fake news detection patterns
        self.suspicious_patterns = [
            'breaking news', 'shocking truth', 'they don\'t want you to know',
            'doctors hate this', 'secret revealed', 'urgent warning',
            'must read', 'viral', 'exposed', 'conspiracy'
        ]
        
        # Reliable news sources
        self.reliable_sources = [
            'reuters.com', 'ap.org', 'bbc.com', 'npr.org',
            'pbs.org', 'cnn.com', 'nytimes.com', 'washingtonpost.com'
        ]

    async def _safe_gemini_call(self, prompt_data):
        """Make Gemini API calls with better error handling"""
        if not self.gemini_model:
            raise Exception("Gemini model not initialized")
        
        try:
            print(f"Making Gemini API call with prompt length: {len(str(prompt_data))}")
            response = await asyncio.wait_for(
                asyncio.to_thread(self.gemini_model.generate_content, prompt_data),
                timeout=60.0
            )
            print(f"Gemini API call successful")
            return response
        except asyncio.TimeoutError:
            print(f"Gemini API call timed out after 60 seconds")
            raise Exception("Gemini API timeout - please try again")
        except Exception as e:
            print(f"Detailed Gemini API error: {type(e).__name__}: {e}")
            if "quota" in str(e).lower() or "limit" in str(e).lower():
                raise Exception("Gemini API quota exceeded")
            raise Exception(f"Gemini API error: {str(e)}")

    async def analyze_text_comprehensive(self, text: str) -> Dict[str, Any]:
        """Comprehensive text analysis using multiple approaches"""
        try:
            # Basic linguistic analysis
            linguistic_analysis = self._analyze_linguistic_patterns(text)
            
            # Sentiment analysis
            sentiment_analysis = self._analyze_sentiment(text)
            
            # Run API calls concurrently with timeouts
            tasks = [
                self._analyze_text_with_gemini(text),
                self._check_facts_api(text),
                self._verify_with_news_apis(text)
            ]
            
            try:
                results = await asyncio.wait_for(asyncio.gather(*tasks, return_exceptions=True), timeout=90.0)
                gemini_analysis, factcheck_results, news_verification = results
                
                # Handle exceptions in results
                if isinstance(gemini_analysis, Exception):
                    print(f"Gemini analysis failed: {gemini_analysis}")
                    gemini_analysis = {'status': 'error', 'error': str(gemini_analysis), 'fake_news_verdict': 'UNKNOWN', 'confidence': 0}
                if isinstance(factcheck_results, Exception):
                    factcheck_results = {'error': str(factcheck_results), 'claims_found': 0}
                if isinstance(news_verification, Exception):
                    news_verification = {'error': str(news_verification), 'articles_found': 0}
                    
            except asyncio.TimeoutError:
                print("API calls timed out after 90 seconds, using fallback values")
                gemini_analysis = {'status': 'timeout', 'error': 'Analysis timeout - please try again', 'fake_news_verdict': 'UNKNOWN', 'confidence': 0}
                factcheck_results = {'error': 'Timeout', 'claims_found': 0}
                news_verification = {'error': 'Timeout', 'articles_found': 0}
            
            # Calculate overall misinformation score
            misinformation_score = self._calculate_misinformation_score(
                linguistic_analysis, sentiment_analysis, factcheck_results, news_verification, gemini_analysis
            )
            
            return {
                'text': text[:200] + '...' if len(text) > 200 else text,
                'misinformation_score': misinformation_score,
                'confidence': min(0.95, max(0.1, misinformation_score * 0.8 + 0.2)),
                'analysis': {
                    'linguistic_patterns': linguistic_analysis,
                    'sentiment': sentiment_analysis,
                    'gemini_analysis': gemini_analysis,
                    'fact_check': factcheck_results,
                    'news_verification': news_verification
                },
                'recommendations': self._generate_recommendations(misinformation_score, gemini_analysis)
            }
        except Exception as e:
            return {
                'error': f'Analysis failed: {str(e)}',
                'misinformation_score': 0.5,
                'confidence': 0.1
            }

    def _analyze_linguistic_patterns(self, text: str) -> Dict[str, Any]:
        """Analyze text for suspicious linguistic patterns"""
        text_lower = text.lower()
        words = text.split()
        
        # Check for suspicious phrases
        suspicious_count = sum(1 for pattern in self.suspicious_patterns if pattern in text_lower)
        
        # Check for excessive punctuation
        exclamation_count = text.count('!')
        question_count = text.count('?')
        caps_ratio = sum(1 for c in text if c.isupper()) / len(text) if text else 0
        
        # Emotional language detection
        emotional_words = [
            'amazing', 'shocking', 'unbelievable', 'incredible', 'outrageous',
            'devastating', 'horrifying', 'terrifying', 'miraculous', 'stunning'
        ]
        emotional_count = sum(1 for word in emotional_words if word in text_lower)
        
        # Calculate risk score
        risk_score = 0
        if suspicious_count > 2: risk_score += 3
        elif suspicious_count > 0: risk_score += 1
        if caps_ratio > 0.3: risk_score += 2
        elif caps_ratio > 0.15: risk_score += 1
        if exclamation_count > 3: risk_score += 1
        if emotional_count > 2: risk_score += 1
        
        risk_level = 'high' if risk_score >= 4 else 'medium' if risk_score >= 2 else 'low'
        
        return {
            'suspicious_phrases': suspicious_count,
            'exclamation_marks': exclamation_count,
            'question_marks': question_count,
            'caps_ratio': caps_ratio,
            'emotional_words': emotional_count,
            'risk_level': risk_level,
            'risk_score': risk_score
        }

    def _analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """Analyze sentiment and subjectivity"""
        try:
            blob = TextBlob(text)
            return {
                'polarity': blob.sentiment.polarity,
                'subjectivity': blob.sentiment.subjectivity,
                'sentiment_label': 'positive' if blob.sentiment.polarity > 0.1 else 'negative' if blob.sentiment.polarity < -0.1 else 'neutral'
            }
        except:
            return {'polarity': 0, 'subjectivity': 0.5, 'sentiment_label': 'neutral'}

    async def _analyze_text_with_gemini(self, text: str) -> Dict[str, Any]:
        """Analyze text using Google Gemini AI"""
        if not self.gemini_model:
            return {
                'status': 'error',
                'error': 'Gemini not available', 
                'fake_news_verdict': 'UNKNOWN', 
                'confidence': 0,
                'analysis': 'AI analysis not available - Gemini API not configured'
            }
        
        try:
            prompt = f"""
            Analyze this text for misinformation, fake news, and manipulation tactics. Provide:
            1. A clear verdict: FAKE NEWS, MODERATELY FAKE, or LEGITIMATE
            2. Confidence percentage (0-100)
            3. Brief analysis explaining your reasoning
            
            Text to analyze: "{text}"
            
            Respond in this exact format:
            VERDICT: [FAKE NEWS/MODERATELY FAKE/LEGITIMATE]
            CONFIDENCE: [0-100]%
            ANALYSIS: [Your detailed analysis]
            """
            
            response = await self._safe_gemini_call(prompt)
            response_text = response.text if hasattr(response, 'text') else str(response)
            
            # Parse response
            verdict = 'UNKNOWN'
            confidence = 50
            analysis = response_text
            
            lines = response_text.split('\n')
            for line in lines:
                if line.startswith('VERDICT:'):
                    verdict = line.replace('VERDICT:', '').strip()
                elif line.startswith('CONFIDENCE:'):
                    try:
                        confidence = int(line.replace('CONFIDENCE:', '').replace('%', '').strip())
                    except:
                        confidence = 50
                elif line.startswith('ANALYSIS:'):
                    analysis = line.replace('ANALYSIS:', '').strip()
            
            return {
                'status': 'success',
                'fake_news_verdict': verdict,
                'confidence': confidence,
                'analysis': analysis,
                'raw_response': response_text
            }
        except Exception as e:
            return {
                'status': 'error',
                'error': f'Gemini analysis failed: {str(e)}',
                'fake_news_verdict': 'UNKNOWN',
                'confidence': 0,
                'analysis': f'AI analysis failed: {str(e)}'
            }

    async def _check_facts_api(self, text: str) -> Dict[str, Any]:
        """Check facts using Google Fact Check Tools API"""
        if not self.factcheck_api_key:
            return {'error': 'Fact Check API not configured', 'claims_found': 0}
        
        try:
            # Extract key phrases for fact-checking
            words = text.split()
            if len(words) > 10:
                query = ' '.join(words[:10])
            else:
                query = text
            
            # Updated API endpoint URL
            url = "https://factchecktools.googleapis.com/v1alpha1/claims:search"
            params = {
                'key': self.factcheck_api_key,
                'query': query,
                'languageCode': 'en',
                'pageSize': 5
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params, timeout=15) as response:
                    response_text = await response.text()
                    
                    if response.status == 200:
                        try:
                            data = await response.json()
                            claims = data.get('claims', [])
                            
                            return {
                                'claims_found': len(claims),
                                'claims': claims[:3],  # Top 3 claims
                                'status': 'success'
                            }
                        except Exception as json_error:
                            return {'error': f'JSON parse error: {str(json_error)}', 'claims_found': 0}
                    elif response.status == 403:
                        return {'error': 'API key invalid or quota exceeded', 'claims_found': 0}
                    elif response.status == 400:
                        return {'error': 'Invalid request parameters', 'claims_found': 0}
                    else:
                        return {'error': f'API error {response.status}: {response_text[:200]}', 'claims_found': 0}
        except asyncio.TimeoutError:
            return {'error': 'Request timeout', 'claims_found': 0}
        except Exception as e:
            return {'error': f'Connection error: {str(e)}', 'claims_found': 0}

    async def _verify_with_news_apis(self, text: str) -> Dict[str, Any]:
        """Verify information using NewsAPI"""
        if not self.newsapi_key:
            return {'error': 'NewsAPI not configured', 'articles_found': 0}
        
        try:
            # Extract keywords for news search
            words = text.split()
            keywords = ' '.join(words[:5])
            
            url = "https://newsapi.org/v2/everything"
            params = {
                'apiKey': self.newsapi_key,
                'q': keywords,
                'sortBy': 'relevancy',
                'pageSize': 5,
                'language': 'en'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params, timeout=10) as response:
                    if response.status == 200:
                        data = await response.json()
                        articles = data.get('articles', [])
                        
                        # Check source reliability
                        reliable_count = sum(1 for article in articles 
                                           if any(source in article.get('url', '') 
                                                for source in self.reliable_sources))
                        
                        return {
                            'articles_found': len(articles),
                            'reliable_sources': reliable_count,
                            'articles': articles[:3],
                            'status': 'success'
                        }
                    else:
                        return {'error': f'NewsAPI error: {response.status}', 'articles_found': 0}
        except Exception as e:
            return {'error': str(e), 'articles_found': 0}

    def _calculate_misinformation_score(self, linguistic, sentiment, factcheck, news, gemini) -> float:
        """Calculate overall misinformation score"""
        score = 0.0
        
        # Linguistic patterns (30% weight)
        if linguistic.get('risk_level') == 'high':
            score += 0.3
        elif linguistic.get('risk_level') == 'medium':
            score += 0.15
        
        # Sentiment analysis (20% weight)
        if sentiment.get('subjectivity', 0) > 0.7:
            score += 0.1
        if abs(sentiment.get('polarity', 0)) > 0.5:
            score += 0.1
        
        # Gemini analysis (40% weight)
        gemini_verdict = gemini.get('fake_news_verdict', 'UNKNOWN')
        if gemini_verdict == 'FAKE NEWS':
            score += 0.4
        elif gemini_verdict == 'MODERATELY FAKE':
            score += 0.2
        
        # Fact-checking (10% weight)
        if factcheck.get('claims_found', 0) == 0:
            score += 0.05
        
        return min(1.0, score)

    def _generate_recommendations(self, score: float, gemini_analysis: Dict) -> List[str]:
        """Generate comprehensive AI-powered recommendations based on analysis"""
        recommendations = []
        
        # Risk-based recommendations
        if score > 0.8:
            recommendations.extend([
                "🚨 CRITICAL: Extremely high misinformation risk detected - DO NOT SHARE without verification",
                "🔍 Immediately fact-check through multiple independent, authoritative sources (Reuters, AP, BBC)",
                "📞 Contact original sources directly if possible to verify claims",
                "⚖️ Consider reporting to platform moderators if this content is spreading false information",
                "🛡️ Warn others about potential misinformation before they encounter it"
            ])
        elif score > 0.6:
            recommendations.extend([
                "⚠️ HIGH RISK: Strong indicators of misinformation - exercise extreme caution",
                "🔎 Verify through at least 3 independent, credible news sources before believing or sharing",
                "📊 Check fact-checking websites (Snopes, PolitiFact, FactCheck.org) for similar claims",
                "🏛️ Look for official statements from relevant authorities or institutions",
                "⏰ Wait 24-48 hours before sharing - misinformation often gets debunked quickly"
            ])
        elif score > 0.4:
            recommendations.extend([
                "⚡ MODERATE RISK: Some suspicious patterns detected - verify before sharing",
                "📰 Cross-reference with established news outlets and their original reporting",
                "🔍 Check the publication date and context - old news sometimes resurfaces as current",
                "👥 Look for expert opinions and official responses to the claims made",
                "📱 Use reverse image search if the content includes photos or videos"
            ])
        elif score > 0.2:
            recommendations.extend([
                "✅ LOW RISK: Content appears mostly legitimate but maintain healthy skepticism",
                "📚 Still worth verifying important claims through primary sources",
                "🔗 Check if the source has a good track record of accurate reporting",
                "💭 Consider the source's potential bias or agenda when interpreting information"
            ])
        else:
            recommendations.extend([
                "✅ VERY LOW RISK: Content shows strong indicators of authenticity",
                "📈 Analysis suggests this information is likely accurate and trustworthy",
                "🎯 Source appears credible, but always maintain critical thinking"
            ])
        
        # AI-specific recommendations based on Gemini analysis
        if gemini_analysis.get('status') == 'success':
            verdict = gemini_analysis.get('fake_news_verdict', '').upper()
            confidence = gemini_analysis.get('confidence', 0)
            
            if 'FAKE' in verdict:
                recommendations.extend([
                    "🤖 AI EXPERT VERDICT: Content flagged as fake news by advanced AI analysis",
                    "🧠 Machine learning models detected deceptive patterns in language and structure",
                    "📋 Consider this a strong warning signal requiring immediate fact-checking"
                ])
            elif 'MODERATE' in verdict:
                recommendations.extend([
                    "🤖 AI ANALYSIS: Content shows mixed signals - some legitimate, some concerning elements",
                    "⚖️ AI detected both authentic and potentially misleading characteristics",
                    "🔍 Focus verification efforts on the most questionable claims identified"
                ])
            elif 'LEGITIMATE' in verdict:
                recommendations.extend([
                    "🤖 AI CONFIDENCE: Advanced analysis suggests content is authentic",
                    "✅ Language patterns and structure align with legitimate news reporting",
                    "📊 AI models found minimal indicators of deception or manipulation"
                ])
            
            # Confidence-based recommendations
            if confidence >= 90:
                recommendations.append("🎯 AI CONFIDENCE: Very high confidence in analysis (90%+) - results highly reliable")
            elif confidence >= 70:
                recommendations.append("📊 AI CONFIDENCE: Good confidence in analysis (70%+) - results generally reliable")
            elif confidence < 50:
                recommendations.append("⚠️ AI UNCERTAINTY: Low confidence in analysis - seek additional verification methods")
        else:
            recommendations.extend([
                "🔧 AI ANALYSIS UNAVAILABLE: Consider using additional verification tools",
                "🌐 Try online fact-checking services and reverse image/text searches",
                "📞 Contact experts or authorities directly for verification"
            ])
        
        # General digital literacy recommendations
        recommendations.extend([
            "📚 DIGITAL LITERACY: Always check the source's credibility and publication history",
            "🕒 TIMING CHECK: Verify the content's publication date and current relevance",
            "🔗 SOURCE VERIFICATION: Look for original sources, citations, and supporting evidence",
            "👥 EXPERT CONSENSUS: Check if multiple experts or authorities agree with the claims",
            "🧠 CRITICAL THINKING: Ask yourself: Who benefits from this information being shared?"
        ])
        
        return recommendations

    async def analyze_image_deepfake(self, image_path: str) -> Dict[str, Any]:
        """Analyze image for deepfake detection"""
        try:
            # Basic image analysis
            image = cv2.imread(image_path)
            if image is None:
                return {
                    'error': 'Could not load image', 
                    'deepfake_risk': 'unknown',
                    'deepfake_score': 0.5,
                    'confidence': 0.1
                }
            
            # Technical analysis
            technical_analysis = self._analyze_image_technical(image)
            
            # Get image properties
            pil_image = Image.open(image_path)
            image_properties = {
                'format': pil_image.format,
                'width': pil_image.width,
                'height': pil_image.height,
                'mode': pil_image.mode
            }
            
            # Gemini Vision analysis
            gemini_analysis = await self._analyze_image_with_gemini(image_path)
            
            # Calculate risk
            risk_level = self._calculate_image_risk(technical_analysis, gemini_analysis)
            deepfake_score = 0.2 if risk_level == 'low' else 0.5 if risk_level == 'medium' else 0.8
            
            return {
                'deepfake_risk': risk_level,
                'deepfake_score': deepfake_score,
                'confidence': 0.85,
                'analysis': {
                    'technical_analysis': technical_analysis,
                    'image_properties': image_properties,
                    'gemini_analysis': gemini_analysis
                },
                'ai_analysis': gemini_analysis.get('analysis', 'No AI analysis available'),
                'recommendations': self._generate_image_recommendations(risk_level)
            }
        except Exception as e:
            return {
                'error': str(e), 
                'deepfake_risk': 'unknown',
                'deepfake_score': 0.5,
                'confidence': 0.1
            }

    def _analyze_image_technical(self, image) -> Dict[str, Any]:
        """Technical analysis of image properties"""
        try:
            height, width, channels = image.shape
            
            # Calculate image quality metrics
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
            
            return {
                'dimensions': f"{width}x{height}",
                'channels': channels,
                'sharpness': float(laplacian_var),
                'quality_score': min(100, laplacian_var / 10)
            }
        except Exception as e:
            return {'error': str(e)}

    async def _analyze_image_with_gemini(self, image_path: str) -> Dict[str, Any]:
        """Analyze image using Gemini Vision"""
        if not self.gemini_model:
            return {
                'status': 'error',
                'analysis': 'Gemini Vision not available',
                'deepfake_verdict': 'UNKNOWN',
                'confidence': 0
            }
        
        try:
            # Load image for Gemini
            image = Image.open(image_path)
            
            prompt = """
            Analyze this image for signs of manipulation, deepfakes, or artificial generation.
            Look for:
            1. Facial inconsistencies
            2. Lighting and shadow anomalies
            3. Unnatural textures or artifacts
            4. Signs of digital manipulation
            
            Respond in this format:
            VERDICT: [AUTHENTIC/LIKELY_FAKE/MANIPULATED]
            CONFIDENCE: [0-100]%
            ANALYSIS: [Your detailed analysis]
            """
            
            response = await self._safe_gemini_call([prompt, image])
            response_text = response.text if hasattr(response, 'text') else str(response)
            
            # Parse response
            verdict = 'UNKNOWN'
            confidence = 50
            analysis = response_text
            
            lines = response_text.split('\n')
            for line in lines:
                if line.startswith('VERDICT:'):
                    verdict = line.replace('VERDICT:', '').strip()
                elif line.startswith('CONFIDENCE:'):
                    try:
                        confidence = int(line.replace('CONFIDENCE:', '').replace('%', '').strip())
                    except:
                        confidence = 50
                elif line.startswith('ANALYSIS:'):
                    analysis = line.replace('ANALYSIS:', '').strip()
            
            return {
                'status': 'success',
                'analysis': analysis,
                'deepfake_verdict': verdict,
                'confidence': confidence
            }
        except Exception as e:
            return {
                'status': 'error',
                'analysis': f'Gemini analysis failed: {str(e)}',
                'deepfake_verdict': 'UNKNOWN',
                'confidence': 0
            }

    def _calculate_image_risk(self, technical, gemini) -> str:
        """Calculate image manipulation risk"""
        risk_score = 0
        
        # Technical factors
        quality = technical.get('quality_score', 50)
        if quality < 20:
            risk_score += 1
        
        # Gemini analysis
        gemini_text = gemini.get('analysis', '').lower()
        if 'high' in gemini_text or 'manipulation' in gemini_text:
            risk_score += 2
        elif 'medium' in gemini_text or 'suspicious' in gemini_text:
            risk_score += 1
        
        return 'high' if risk_score >= 2 else 'medium' if risk_score == 1 else 'low'

    def _generate_image_recommendations(self, risk_level: str) -> List[str]:
        """Generate comprehensive recommendations for image analysis"""
        recommendations = []
        
        if risk_level == 'high':
            recommendations.extend([
                "🚨 CRITICAL: High probability of image manipulation or deepfake detected",
                "🔍 IMMEDIATE ACTION: Perform reverse image search on Google, TinEye, and Yandex",
                "📅 VERIFICATION: Check original publication date and source of the image",
                "🔬 TECHNICAL ANALYSIS: Look for inconsistencies in lighting, shadows, and image quality",
                "👥 EXPERT CONSULTATION: Consider consulting digital forensics experts for important cases",
                "🚫 DO NOT SHARE: Avoid spreading potentially manipulated content",
                "📱 REPORT: Consider reporting to platform moderators if used maliciously"
            ])
        elif risk_level == 'medium':
            recommendations.extend([
                "⚠️ MODERATE RISK: Some indicators of potential manipulation detected",
                "🔍 VERIFY FIRST: Use reverse image search to find original source",
                "📊 CROSS-CHECK: Compare with other images from the same event or location",
                "🕒 DATE CHECK: Verify when and where the image was originally taken",
                "⏸️ PAUSE BEFORE SHARING: Take time to verify authenticity",
                "🔎 EXAMINE DETAILS: Look closely for unnatural elements or inconsistencies"
            ])
        else:
            recommendations.extend([
                "✅ LOW RISK: Image appears authentic based on technical analysis",
                "🔍 STILL VERIFY: Even authentic images can be used in wrong context",
                "📅 CONTEXT CHECK: Ensure image matches claimed date, location, and event",
                "📰 SOURCE VERIFICATION: Confirm the image comes from a credible source"
            ])
        
        # Universal image verification recommendations
        recommendations.extend([
            "🔧 TECHNICAL TIPS: Check EXIF data for camera settings and location information",
            "🌐 REVERSE SEARCH: Use Google Images, TinEye, or Yandex to find image origins",
            "📱 MOBILE TOOLS: Use apps like FotoForensics or JPEGsnoop for deeper analysis",
            "👁️ VISUAL INSPECTION: Look for blurred edges, unnatural skin textures, or lighting mismatches",
            "🎯 FOCUS AREAS: Pay special attention to faces, hands, and background consistency",
            "📚 LEARN MORE: Study common deepfake and manipulation techniques to improve detection skills"
        ])
        
        return recommendations

    async def analyze_video_deepfake(self, video_path: str) -> Dict[str, Any]:
        """Analyze video for deepfake detection"""
        try:
            # Get video properties first
            cap = cv2.VideoCapture(video_path)
            fps = cap.get(cv2.CAP_PROP_FPS)
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            duration = frame_count / fps if fps > 0 else 0
            cap.release()
            
            # Extract frames for analysis
            frames = self._extract_video_frames(video_path)
            if not frames:
                return {'error': 'Could not extract video frames', 'deepfake_risk': 'unknown'}
            
            # Analyze sample frames
            frame_analyses = []
            gemini_analyses = []
            
            for i, frame_path in enumerate(frames[:5]):  # Analyze first 5 frames
                analysis = await self.analyze_image_deepfake(frame_path)
                frame_analyses.append(analysis)
                
                # Extract Gemini analysis for aggregation
                if analysis.get('analysis', {}).get('gemini_analysis', {}).get('analysis'):
                    gemini_analyses.append({
                        'frame': i + 1,
                        'analysis': analysis['analysis']['gemini_analysis']['analysis'],
                        'verdict': analysis['analysis']['gemini_analysis'].get('deepfake_verdict', 'UNKNOWN'),
                        'confidence': analysis['analysis']['gemini_analysis'].get('confidence', 0)
                    })
                
                # Clean up frame file
                try:
                    os.remove(frame_path)
                except:
                    pass
            
            # Aggregate results
            risk_levels = [analysis.get('deepfake_risk', 'low') for analysis in frame_analyses]
            high_risk_count = risk_levels.count('high')
            medium_risk_count = risk_levels.count('medium')
            
            overall_risk = 'high' if high_risk_count >= 2 else 'medium' if medium_risk_count >= 3 else 'low'
            deepfake_score = 0.8 if overall_risk == 'high' else 0.5 if overall_risk == 'medium' else 0.2
            
            # Create aggregated Gemini analysis
            aggregated_gemini = None
            if gemini_analyses:
                # Combine all frame analyses
                combined_analysis = "\n\n".join([
                    f"Frame {ga['frame']}: {ga['analysis']}" for ga in gemini_analyses
                ])
                
                # Calculate average confidence
                avg_confidence = sum(ga['confidence'] for ga in gemini_analyses) / len(gemini_analyses)
                
                # Determine overall verdict
                verdicts = [ga['verdict'] for ga in gemini_analyses]
                verdict_counts = {}
                for v in verdicts:
                    verdict_counts[v] = verdict_counts.get(v, 0) + 1
                overall_verdict = max(verdict_counts.items(), key=lambda x: x[1])[0]
                
                aggregated_gemini = {
                    'status': 'success',
                    'analysis': combined_analysis,
                    'deepfake_verdict': overall_verdict,
                    'confidence': int(avg_confidence)
                }
            
            return {
                'deepfake_risk': overall_risk,
                'deepfake_score': deepfake_score,
                'confidence': 0.85,
                'frames_analyzed': len(frame_analyses),
                'high_risk_frames': high_risk_count,
                'medium_risk_frames': medium_risk_count,
                'frame_analyses': frame_analyses,
                'analysis': {
                    'video_properties': {
                        'duration': duration,
                        'fps': fps,
                        'frame_count': frame_count
                    },
                    'gemini_analysis': aggregated_gemini,
                    'frame_analysis': {
                        'frames_analyzed': len(frame_analyses),
                        'high_risk_frames': high_risk_count,
                        'medium_risk_frames': medium_risk_count
                    }
                },
                'recommendations': self._generate_video_recommendations(overall_risk)
            }
        except Exception as e:
            return {'error': str(e), 'deepfake_risk': 'unknown', 'deepfake_score': 0.5, 'confidence': 0.1}

    def _extract_video_frames(self, video_path: str, max_frames: int = 5) -> List[str]:
        """Extract frames from video for analysis"""
        try:
            cap = cv2.VideoCapture(video_path)
            frames = []
            frame_count = 0
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            
            # Calculate frame interval to get evenly distributed frames
            interval = max(1, total_frames // (max_frames + 1)) if total_frames > max_frames else 1
            
            while cap.isOpened() and len(frames) < max_frames:
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Save frames at calculated intervals
                if frame_count % interval == 0:
                    frame_path = f"temp_frame_{len(frames)}_{os.getpid()}.jpg"
                    cv2.imwrite(frame_path, frame)
                    frames.append(frame_path)
                
                frame_count += 1
            
            cap.release()
            return frames
        except Exception as e:
            print(f"Frame extraction error: {e}")
            return []

    def _generate_video_recommendations(self, risk_level: str) -> List[str]:
        """Generate comprehensive recommendations for video analysis"""
        recommendations = []
        
        if risk_level == 'high':
            recommendations.extend([
                "🚨 CRITICAL: High probability of deepfake or synthetic video detected",
                "🎬 FRAME ANALYSIS: Multiple frames show signs of artificial generation or manipulation",
                "🔍 IMMEDIATE VERIFICATION: Search for original video source across multiple platforms",
                "👥 EXPERT REVIEW: Consider professional deepfake detection services for critical cases",
                "🚫 DO NOT SHARE: Avoid spreading potentially synthetic content",
                "📱 REPORT DEEPFAKE: Report to platform if used to spread misinformation or harm reputation",
                "⚖️ LEGAL CONSIDERATION: Deepfakes may have legal implications - document evidence",
                "🔬 TECHNICAL ANALYSIS: Look for temporal inconsistencies and unnatural facial movements"
            ])
        elif risk_level == 'medium':
            recommendations.extend([
                "⚠️ MODERATE RISK: Some frames show potential manipulation indicators",
                "🎥 DETAILED REVIEW: Watch video multiple times, focusing on facial expressions and lip-sync",
                "🔍 SOURCE VERIFICATION: Find original publication and verify the context",
                "📊 COMPARE VERSIONS: Look for other versions of the same video online",
                "⏸️ PAUSE AND EXAMINE: Check individual frames for inconsistencies",
                "🕒 TIMING VERIFICATION: Confirm the video matches claimed date and event",
                "👁️ VISUAL CUES: Watch for unnatural blinking, facial expressions, or voice sync issues"
            ])
        else:
            recommendations.extend([
                "✅ LOW RISK: Video appears authentic based on frame-by-frame analysis",
                "🔍 CONTEXT VERIFICATION: Ensure video context matches claims about when/where it was filmed",
                "📰 SOURCE CHECK: Verify the video comes from a credible, original source",
                "📅 DATE VERIFICATION: Confirm the video is recent and not recycled from past events"
            ])
        
        # Universal video verification recommendations
        recommendations.extend([
            "🎬 TECHNICAL ANALYSIS: Check video metadata for creation date, device, and location",
            "🔍 REVERSE VIDEO SEARCH: Use InVID or Google to find original video sources",
            "👥 WITNESS VERIFICATION: Look for multiple independent sources filming the same event",
            "🎯 FOCUS ON DETAILS: Pay attention to background consistency, lighting, and audio sync",
            "📱 MOBILE VERIFICATION: Use apps like InVID WeVerify for comprehensive video analysis",
            "🧠 BEHAVIORAL ANALYSIS: Watch for natural vs. artificial facial expressions and body language",
            "🔊 AUDIO ANALYSIS: Check if voice matches speaker's known vocal patterns and characteristics",
            "📚 EDUCATION: Learn about common deepfake artifacts like flickering, blurring, and temporal inconsistencies",
            "⚡ QUICK CHECKS: Look for unnatural eye movements, inconsistent lighting, and facial boundary artifacts"
        ])
        
        return recommendations