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
        self.factcheck_api_key = os.getenv('FACTCHECK_API_KEY', 'AIzaSyD7Dn5kdg5W_QzaSbKza8stWfx_qWt_EHc')
        self.gemini_api_key = os.getenv('GEMINI_API_KEY', 'AIzaSyDCDMiQMc7fb3T2NZUf5WeBg5bbDd7TCNg')
        
        # Configure Google Gemini
        if self.gemini_api_key:
            try:
                genai.configure(api_key=self.gemini_api_key)
                self.gemini_model = genai.GenerativeModel('gemini-2.5-flash')
                print(f"Google Gemini configured successfully")
            except Exception as e:
                print(f"Gemini configuration failed: {e}")
                self.gemini_model = None
        else:
            self.gemini_model = None
            print("Google Gemini API key not configured - using basic analysis mode")
            
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
            response = await asyncio.to_thread(self.gemini_model.generate_content, prompt_data)
            print(f"Gemini API call successful")
            return response
        except Exception as e:
            print(f"Detailed Gemini API error: {type(e).__name__}: {e}")
            if hasattr(e, 'details'):
                print(f"Error details: {e.details()}")
            raise e

    async def analyze_text_comprehensive(self, text: str) -> Dict[str, Any]:
        """Comprehensive text analysis using multiple approaches"""
        try:
            # Basic linguistic analysis
            linguistic_analysis = self._analyze_linguistic_patterns(text)
            
            # Sentiment analysis
            sentiment_analysis = self._analyze_sentiment(text)
            
            # Gemini AI analysis for text
            gemini_analysis = await self._analyze_text_with_gemini(text)
            
            # Fact-checking API calls
            factcheck_results = await self._check_facts_api(text)
            
            # News verification
            news_verification = await self._verify_with_news_apis(text)
            
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
            
            url = f"https://factchecktools.googleapis.com/v1alpha1/claims:search"
            params = {
                'key': self.factcheck_api_key,
                'query': query,
                'languageCode': 'en'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params, timeout=10) as response:
                    if response.status == 200:
                        data = await response.json()
                        claims = data.get('claims', [])
                        
                        return {
                            'claims_found': len(claims),
                            'claims': claims[:3],  # Top 3 claims
                            'status': 'success'
                        }
                    else:
                        return {'error': f'API error: {response.status}', 'claims_found': 0}
        except Exception as e:
            return {'error': str(e), 'claims_found': 0}

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
        """Generate recommendations based on analysis"""
        recommendations = []
        
        if score > 0.7:
            recommendations.extend([
                "⚠️ High risk of misinformation detected",
                "Verify information through multiple reliable sources",
                "Check official sources and fact-checking websites"
            ])
        elif score > 0.4:
            recommendations.extend([
                "⚡ Moderate risk detected - exercise caution",
                "Cross-reference with trusted news sources"
            ])
        else:
            recommendations.append("✅ Content appears legitimate based on analysis")
        
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
        """Generate recommendations for image analysis"""
        if risk_level == 'high':
            return [
                "⚠️ High risk of manipulation detected",
                "Verify image authenticity through reverse image search",
                "Check original source and publication date"
            ]
        elif risk_level == 'medium':
            return [
                "⚡ Moderate risk detected",
                "Exercise caution when sharing this image"
            ]
        else:
            return ["✅ Image appears authentic based on analysis"]

    async def analyze_video_deepfake(self, video_path: str) -> Dict[str, Any]:
        """Analyze video for deepfake detection"""
        try:
            # Extract frames for analysis
            frames = self._extract_video_frames(video_path)
            if not frames:
                return {'error': 'Could not extract video frames', 'deepfake_risk': 'unknown'}
            
            # Analyze sample frames
            frame_analyses = []
            for i, frame_path in enumerate(frames[:5]):  # Analyze first 5 frames
                analysis = await self.analyze_image_deepfake(frame_path)
                frame_analyses.append(analysis)
                
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
            
            return {
                'deepfake_risk': overall_risk,
                'frames_analyzed': len(frame_analyses),
                'high_risk_frames': high_risk_count,
                'medium_risk_frames': medium_risk_count,
                'frame_analyses': frame_analyses,
                'recommendations': self._generate_video_recommendations(overall_risk)
            }
        except Exception as e:
            return {'error': str(e), 'deepfake_risk': 'unknown'}

    def _extract_video_frames(self, video_path: str, max_frames: int = 5) -> List[str]:
        """Extract frames from video for analysis"""
        try:
            cap = cv2.VideoCapture(video_path)
            frames = []
            frame_count = 0
            
            while cap.isOpened() and len(frames) < max_frames:
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Save every 30th frame
                if frame_count % 30 == 0:
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
        """Generate recommendations for video analysis"""
        if risk_level == 'high':
            return [
                "⚠️ High risk of deepfake detected",
                "Verify video authenticity through multiple sources",
                "Check for original publication and context"
            ]
        elif risk_level == 'medium':
            return [
                "⚡ Moderate risk detected",
                "Exercise caution when sharing this video"
            ]
        else:
            return ["✅ Video appears authentic based on analysis"]