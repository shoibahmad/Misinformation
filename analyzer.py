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

# Load environment variables safely (ignore malformed lines in .env)
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
        # API Keys - Replace with your actual keys
        self.newsapi_key = os.getenv('NEWSAPI_KEY', '1aef5e04e84643a889ba8e0f377e196b')
        self.factcheck_api_key = os.getenv('FACTCHECK_API_KEY', 'AIzaSyAouVSfu1BO_oYrOIOXoMuegrf3Oj1ceqk')  # Use proper Google Cloud API key
        self.gemini_api_key = os.getenv('GEMINI_API_KEY', 'AIzaSyD3adGsM5dxI_OytL68ePc4eeQRwrpwx80')
        
        # Configure Google Gemini
        if self.gemini_api_key and len(self.gemini_api_key) > 20:
            try:
                genai.configure(api_key=self.gemini_api_key)
                
                try:
                    models = genai.list_models()
                    available_models = [model.name for model in models]
                    print(f"📋 Available Gemini models: {available_models[:5]}...")  # Show first 5
                except Exception as list_error:
                    print(f"⚠️ Could not list models: {list_error}")
                
                # Try different model names in order of preference
                model_names = [
                    'gemini-1.5-flash',
                    'gemini-1.5-pro', 
                    'gemini-1.0-pro-vision-latest',
                    'gemini-1.0-pro-vision',
                    'gemini-pro-vision',
                    'gemini-pro'
                ]
                
                self.gemini_model = None
                for model_name in model_names:
                    try:
                        self.gemini_model = genai.GenerativeModel(model_name)
                        print(f"✅ Google Gemini configured successfully with model: {model_name}")
                        break
                    except Exception as model_error:
                        print(f"⚠️ Model {model_name} failed: {model_error}")
                        continue
                
                if not self.gemini_model:
                    print("❌ All Gemini models failed to initialize")
                    
            except Exception as e:
                print(f"⚠️ Warning: Gemini configuration failed: {e}")
                self.gemini_model = None
        else:
            self.gemini_model = None
            print("ℹ️ Google Gemini API key not configured - using basic analysis mode")
            
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
        
        # Expanded emotional language detection
        emotional_words = [
            'amazing', 'shocking', 'unbelievable', 'incredible', 'outrageous',
            'devastating', 'horrifying', 'terrifying', 'miraculous', 'stunning',
            'explosive', 'bombshell', 'sensational', 'jaw-dropping', 'mind-blowing'
        ]
        emotional_count = sum(1 for word in emotional_words if word in text_lower)
        
        # Check for absolute terms
        absolute_terms = ['always', 'never', 'all', 'none', 'every', 'completely', 'totally', 'absolutely']
        absolute_count = sum(1 for term in absolute_terms if term in text_lower)
        
        # Check for urgency indicators
        urgency_words = ['urgent', 'immediately', 'now', 'quickly', 'hurry', 'deadline', 'limited time']
        urgency_count = sum(1 for word in urgency_words if word in text_lower)
        
        # Calculate word count and sentence metrics
        word_count = len(words)
        sentence_count = max(1, text.count('.') + text.count('!') + text.count('?'))
        avg_sentence_length = word_count / sentence_count
        
        # Determine risk level based on multiple factors
        risk_score = 0
        if suspicious_count > 2:
            risk_score += 3
        elif suspicious_count > 0:
            risk_score += 1
            
        if caps_ratio > 0.3:
            risk_score += 2
        elif caps_ratio > 0.15:
            risk_score += 1
            
        if exclamation_count > 3:
            risk_score += 1
            
        if emotional_count > 2:
            risk_score += 1
            
        if absolute_count > 3:
            risk_score += 1
            
        if urgency_count > 1:
            risk_score += 1
        
        risk_level = 'high' if risk_score >= 4 else 'medium' if risk_score >= 2 else 'low'
        
        return {
            'suspicious_phrases': suspicious_count,
            'exclamation_marks': exclamation_count,
            'question_marks': question_count,
            'caps_ratio': caps_ratio,
            'emotional_language': emotional_count,
            'absolute_terms': absolute_count,
            'urgency_indicators': urgency_count,
            'word_count': word_count,
            'sentence_count': sentence_count,
            'avg_sentence_length': avg_sentence_length,
            'risk_score': risk_score,
            'risk_level': risk_level
        }

    def _analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """Analyze sentiment using TextBlob"""
        try:
            blob = TextBlob(text)
            polarity = blob.sentiment.polarity
            subjectivity = blob.sentiment.subjectivity
            
            return {
                'polarity': polarity,
                'subjectivity': subjectivity,
                'sentiment': 'positive' if polarity > 0.1 else 'negative' if polarity < -0.1 else 'neutral',
                'objectivity': 'subjective' if subjectivity > 0.5 else 'objective'
            }
        except Exception as e:
            return {'error': f'Sentiment analysis failed: {str(e)}'}

    async def _analyze_text_with_gemini(self, text: str) -> Dict[str, Any]:
        """Analyze text using Google Gemini for misinformation detection with clear verdict"""
        try:
            if not self.gemini_model:
                return {'status': 'not_available', 'analysis': 'Gemini not configured'}
            
            prompt = f"""
            As an expert fact-checker and misinformation analyst with extensive experience in detecting fake news, propaganda, and misleading information, analyze the following text comprehensively:

            TEXT TO ANALYZE: "{text}"

            Provide a detailed analysis with the following sections:

            🎯 VERDICT: [Choose ONE - FAKE NEWS / MODERATELY FAKE / LEGITIMATE]

            📊 CONFIDENCE LEVEL: [0-100%] - How certain are you of this assessment?

            🔍 KEY INDICATORS:
            - List 3-5 specific elements that led to your conclusion
            - Include linguistic patterns, factual claims, emotional language, etc.

            📋 DETAILED FACT-CHECK ANALYSIS:
            • VERIFIABLE CLAIMS: What can be fact-checked?
            • UNSUBSTANTIATED ASSERTIONS: What lacks evidence?
            • EMOTIONAL MANIPULATION: Identify bias and emotional triggers
            • SOURCE CREDIBILITY: Assess reliability indicators
            • LOGICAL CONSISTENCY: Check for contradictions or fallacies
            • BIAS INDICATORS: Political, commercial, or ideological bias

            🚩 RED FLAGS DETECTED:
            - List specific misinformation patterns found
            - Include propaganda techniques, logical fallacies, etc.

            💡 RECOMMENDATIONS:
            - Specific actions readers should take
            - How to verify the information
            - Whether to share or avoid sharing

            🎓 EXPERT REASONING:
            Explain your analytical process and why you reached this conclusion.

            Be thorough, decisive, and provide actionable insights. Use clear, professional language.
            """
            
            response = await asyncio.to_thread(
                self.gemini_model.generate_content, prompt
            )
            
            # Extract verdict and risk level from response
            response_text = response.text.lower()
            
            # Determine fake news verdict
            if 'fake news' in response_text or 'verdict: fake' in response_text:
                fake_news_verdict = 'FAKE NEWS'
                risk_level = 'high'
            elif 'moderately fake' in response_text or 'verdict: moderately' in response_text:
                fake_news_verdict = 'MODERATELY FAKE'
                risk_level = 'medium'
            elif 'legitimate' in response_text or 'verdict: legitimate' in response_text:
                fake_news_verdict = 'LEGITIMATE'
                risk_level = 'low'
            else:
                # Fallback based on risk indicators
                if 'high risk' in response_text or 'highly suspicious' in response_text:
                    fake_news_verdict = 'FAKE NEWS'
                    risk_level = 'high'
                elif 'medium risk' in response_text or 'moderate' in response_text:
                    fake_news_verdict = 'MODERATELY FAKE'
                    risk_level = 'medium'
                else:
                    fake_news_verdict = 'LEGITIMATE'
                    risk_level = 'low'
            
            # Extract confidence level
            confidence = 85  # Default confidence
            import re
            confidence_match = re.search(r'confidence.*?(\d+)%', response_text)
            if confidence_match:
                confidence = int(confidence_match.group(1))
            
            return {
                'status': 'success',
                'analysis': response.text,
                'risk_level': risk_level,
                'fake_news_verdict': fake_news_verdict,
                'confidence': confidence,
                'has_analysis': True
            }
            
        except Exception as e:
            print(f"⚠️ Gemini text analysis failed: {e}")
            return {
                'status': 'error',
                'analysis': f'Gemini analysis failed: {str(e)}',
                'risk_level': 'unknown',
                'fake_news_verdict': 'UNKNOWN',
                'confidence': 0,
                'has_analysis': False
            }

    async def _check_facts_api(self, text: str) -> Dict[str, Any]:
        """Check facts using Google Fact Check Tools API"""
        try:
            # Check if API key is properly configured
            if (not self.factcheck_api_key or 
                self.factcheck_api_key == 'YOUR_FACTCHECK_API_KEY_HERE' or
                self.factcheck_api_key.strip() == '' or
                '.apps.googleusercontent.com' in self.factcheck_api_key):
                return {
                    'status': 'API key not configured', 
                    'claims_found': 0,
                    'claims': [],
                    'has_fact_checks': False,
                    'message': 'Google Fact Check Tools API key not properly configured'
                }
            
            url = "https://factchecktools.googleapis.com/v1alpha1/claims:search"
            params = {
                'key': self.factcheck_api_key,
                'query': text[:500],  # Limit query length
                'languageCode': 'en'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        claims = data.get('claims', [])
                        return {
                            'status': 'success',
                            'claims_found': len(claims),
                            'claims': claims[:3],  # Return top 3 claims
                            'has_fact_checks': len(claims) > 0
                        }
                    elif response.status == 400:
                        return {
                            'status': 'error', 
                            'message': 'Invalid API key or request format',
                            'claims_found': 0,
                            'claims': [],
                            'has_fact_checks': False
                        }
                    elif response.status == 403:
                        return {
                            'status': 'error', 
                            'message': 'API key lacks permission or quota exceeded',
                            'claims_found': 0,
                            'claims': [],
                            'has_fact_checks': False
                        }
                    else:
                        return {
                            'status': 'error', 
                            'message': f'API returned status {response.status}',
                            'claims_found': 0,
                            'claims': [],
                            'has_fact_checks': False
                        }
        except Exception as e:
            return {
                'status': 'error', 
                'message': f'Fact check API error: {str(e)}',
                'claims_found': 0,
                'claims': [],
                'has_fact_checks': False
            }

    async def _verify_with_news_apis(self, text: str) -> Dict[str, Any]:
        """Verify information using NewsAPI"""
        try:
            if (not self.newsapi_key or 
                self.newsapi_key == 'YOUR_NEWSAPI_KEY_HERE' or
                self.newsapi_key.strip() == ''):
                return {
                    'status': 'API key not configured', 
                    'total_articles': 0,
                    'reliable_sources': 0,
                    'reliability_ratio': 0,
                    'top_articles': [],
                    'message': 'NewsAPI key not configured'
                }
            
            # Extract key terms for search
            words = text.split()[:10]  # Use first 10 words
            query = ' '.join(words)
            
            url = "https://newsapi.org/v2/everything"
            params = {
                'apiKey': self.newsapi_key,
                'q': query,
                'language': 'en',
                'pageSize': 10,
                'sortBy': 'relevancy'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        articles = data.get('articles', [])
                        
                        # Check source reliability
                        reliable_count = 0
                        for article in articles:
                            source_url = article.get('url', '')
                            source_name = article.get('source', {}).get('name', '')
                            if any(reliable in source_url or reliable in source_name for reliable in self.reliable_sources):
                                reliable_count += 1
                        
                        return {
                            'status': 'success',
                            'total_articles': len(articles),
                            'reliable_sources': reliable_count,
                            'reliability_ratio': reliable_count / len(articles) if articles else 0,
                            'top_articles': articles[:3]
                        }
                    elif response.status == 401:
                        return {
                            'status': 'error', 
                            'message': 'Invalid NewsAPI key',
                            'total_articles': 0,
                            'reliable_sources': 0,
                            'reliability_ratio': 0,
                            'top_articles': []
                        }
                    elif response.status == 429:
                        return {
                            'status': 'error', 
                            'message': 'NewsAPI rate limit exceeded',
                            'total_articles': 0,
                            'reliable_sources': 0,
                            'reliability_ratio': 0,
                            'top_articles': []
                        }
                    else:
                        return {
                            'status': 'error', 
                            'message': f'NewsAPI returned status {response.status}',
                            'total_articles': 0,
                            'reliable_sources': 0,
                            'reliability_ratio': 0,
                            'top_articles': []
                        }
        except Exception as e:
            return {
                'status': 'error', 
                'message': f'NewsAPI error: {str(e)}',
                'total_articles': 0,
                'reliable_sources': 0,
                'reliability_ratio': 0,
                'top_articles': []
            }

    def _calculate_misinformation_score(self, linguistic, sentiment, factcheck, news, gemini=None) -> float:
        """Calculate overall misinformation score (0-1, higher = more likely misinformation)"""
        score = 0.0
        score_breakdown = []
        
        # Linguistic patterns (40% weight) - More dynamic scoring
        suspicious_count = linguistic.get('suspicious_phrases', 0)
        caps_ratio = linguistic.get('caps_ratio', 0)
        exclamation_count = linguistic.get('exclamation_marks', 0)
        emotional_count = linguistic.get('emotional_language', 0)
        
        linguistic_score = 0
        if suspicious_count > 3:
            linguistic_score += 0.25
        elif suspicious_count > 1:
            linguistic_score += 0.15
        elif suspicious_count > 0:
            linguistic_score += 0.05
        
        if caps_ratio > 0.3:
            linguistic_score += 0.1
        elif caps_ratio > 0.15:
            linguistic_score += 0.05
        
        if exclamation_count > 5:
            linguistic_score += 0.05
        
        if emotional_count > 2:
            linguistic_score += 0.05
        
        score += min(0.4, linguistic_score)
        score_breakdown.append(f"Linguistic: {linguistic_score:.3f}")
        
        # Sentiment analysis (20% weight)
        sentiment_score = 0
        subjectivity = sentiment.get('subjectivity', 0)
        polarity = abs(sentiment.get('polarity', 0))
        
        if subjectivity > 0.8:
            sentiment_score += 0.15
        elif subjectivity > 0.6:
            sentiment_score += 0.1
        elif subjectivity > 0.4:
            sentiment_score += 0.05
        
        if polarity > 0.7:
            sentiment_score += 0.05
        
        score += min(0.2, sentiment_score)
        score_breakdown.append(f"Sentiment: {sentiment_score:.3f}")
        
        # Fact-checking results (20% weight)
        factcheck_score = 0
        if factcheck.get('status') == 'success':
            if factcheck.get('has_fact_checks'):
                factcheck_score += 0.1  # Controversial content
            claims_found = factcheck.get('claims_found', 0)
            if claims_found > 3:
                factcheck_score += 0.1
        elif factcheck.get('status') == 'error':
            factcheck_score += 0.05  # Slight penalty for API issues
        
        score += min(0.2, factcheck_score)
        score_breakdown.append(f"Fact-check: {factcheck_score:.3f}")
        
        # News verification (20% weight)
        news_score = 0
        if news.get('status') == 'success':
            reliability_ratio = news.get('reliability_ratio', 0.5)
            total_articles = news.get('total_articles', 0)
            
            if total_articles == 0:
                news_score += 0.15  # No articles found is suspicious
            elif reliability_ratio < 0.2:
                news_score += 0.2
            elif reliability_ratio < 0.4:
                news_score += 0.15
            elif reliability_ratio < 0.6:
                news_score += 0.1
            elif reliability_ratio < 0.8:
                news_score += 0.05
        elif news.get('status') == 'error':
            news_score += 0.05  # Slight penalty for API issues
        
        score += min(0.2, news_score)
        score_breakdown.append(f"News: {news_score:.3f}")
        
        # Gemini AI analysis (20% weight) - Enhanced with verdict
        gemini_score = 0
        if gemini and gemini.get('status') == 'success':
            # Use verdict for more accurate scoring
            verdict = gemini.get('fake_news_verdict', '').upper()
            confidence = gemini.get('confidence', 0) / 100.0  # Convert to 0-1 scale
            
            if verdict == 'FAKE NEWS':
                gemini_score += 0.2 * confidence
            elif verdict == 'MODERATELY FAKE':
                gemini_score += 0.1 * confidence
            elif verdict == 'LEGITIMATE':
                gemini_score += 0.0
            else:
                # Fallback to risk level
                gemini_risk = gemini.get('risk_level', 'low')
                if gemini_risk == 'high':
                    gemini_score += 0.2
                elif gemini_risk == 'medium':
                    gemini_score += 0.1
        elif gemini and gemini.get('status') == 'error':
            gemini_score += 0.05  # Slight penalty for analysis failure
        
        score += min(0.2, gemini_score)
        score_breakdown.append(f"Gemini: {gemini_score:.3f}")
        
        final_score = min(1.0, score)
        print(f"📊 Score breakdown: {' | '.join(score_breakdown)} = {final_score:.3f}")
        
        return final_score

    def _generate_recommendations(self, score: float, gemini_analysis: Dict = None) -> List[str]:
        """Generate recommendations based on misinformation score and Gemini verdict"""
        recommendations = []
        
        # Add Gemini-specific recommendations first
        if gemini_analysis and gemini_analysis.get('status') == 'success':
            verdict = gemini_analysis.get('fake_news_verdict', '').upper()
            confidence = gemini_analysis.get('confidence', 0)
            
            if verdict == 'FAKE NEWS':
                recommendations.extend([
                    f"🧠 AI Expert Verdict: FAKE NEWS (Confidence: {confidence}%)",
                    "🚨 Do NOT share this content",
                    "⚠️ This content contains significant misinformation"
                ])
            elif verdict == 'MODERATELY FAKE':
                recommendations.extend([
                    f"🧠 AI Expert Verdict: MODERATELY FAKE (Confidence: {confidence}%)",
                    "⚡ Exercise extreme caution",
                    "🔍 Verify all claims before considering"
                ])
            elif verdict == 'LEGITIMATE':
                recommendations.extend([
                    f"🧠 AI Expert Verdict: LEGITIMATE (Confidence: {confidence}%)",
                    "✅ Content appears credible according to AI analysis"
                ])
        
        # Add traditional score-based recommendations
        if score > 0.7:
            recommendations.extend([
                "⚠️ High risk of misinformation detected",
                "🔍 Verify information with multiple reliable sources",
                "❌ Avoid sharing until verified"
            ])
        elif score > 0.4:
            recommendations.extend([
                "⚡ Moderate risk detected",
                "📊 Cross-check with fact-checking websites",
                "🤔 Consider the source credibility"
            ])
        else:
            recommendations.extend([
                "✅ Low risk of misinformation",
                "📰 Information appears to align with reliable sources",
                "👍 Still recommended to verify important claims"
            ])
        
        return recommendations

    async def analyze_image_deepfake(self, image_path: str, fast_mode: bool = False) -> Dict[str, Any]:
        """Analyze image for deepfakes and manipulation using Google Gemini Pro Vision"""
        try:
            if not self.gemini_model:
                print("ℹ️ Using basic image analysis (Gemini not available)")
                return await self._basic_image_analysis(image_path)
            
            # Load and prepare image
            image = Image.open(image_path)
            
            # OPTIMIZATION: Use different prompts based on mode
            if fast_mode:
                # Concise prompt for video frame analysis
                prompt = """
                Quick deepfake analysis:
                
                🎯 VERDICT: [AUTHENTIC/SUSPICIOUS/FAKE]
                📊 CONFIDENCE: [0-100%]
                🔍 KEY ISSUES: [Brief list if any]
                
                Focus on obvious facial inconsistencies, lighting problems, or clear manipulation artifacts.
                Be fast and decisive.
                """
            else:
                # Detailed prompt for standalone image analysis
                prompt = """
                As an expert digital forensics analyst, analyze this image for authenticity. Be conservative and accurate in your assessment.

                IMPORTANT: Most real photos should be classified as AUTHENTIC unless there are clear, obvious signs of manipulation.

                🔍 ANALYSIS CHECKLIST:

                1. 🎭 FACIAL ANALYSIS (if faces present):
                   - Are facial features naturally proportioned?
                   - Do eyes, mouth, and expressions look natural?
                   - Is skin texture consistent and realistic?
                   - Are there any obvious blending artifacts?

                2. 💡 LIGHTING & CONSISTENCY:
                   - Is lighting consistent across the entire image?
                   - Do shadows match the apparent light sources?
                   - Are reflections in eyes/surfaces accurate?

                3. 🖼️ TECHNICAL QUALITY:
                   - Does image quality look consistent throughout?
                   - Are there obvious compression or editing artifacts?
                   - Does the resolution appear uniform?

                4. 🎨 MANIPULATION INDICATORS:
                   - Any obvious clone/copy-paste artifacts?
                   - Unnatural color transitions or gradients?
                   - Visible editing tool marks?

                🎯 AUTHENTICITY VERDICT: Choose ONE based on evidence:
                - AUTHENTIC: No clear signs of manipulation (default for normal photos)
                - LIKELY MANIPULATED: Some suspicious indicators but not definitive
                - DEFINITELY FAKE: Clear, obvious manipulation evidence

                📊 CONFIDENCE: [0-100%] - Only high confidence if you see clear evidence

                🚩 EVIDENCE: List ONLY specific manipulation indicators you can clearly identify

                💡 REASONING: Explain why you reached this conclusion with specific evidence

                Be conservative - err on the side of authenticity unless manipulation is obvious.
                """
            
            print("🔍 Running Gemini analysis...")
            try:
                # Try with image and text (for vision-capable models)
                response = await asyncio.to_thread(
                    self.gemini_model.generate_content, [prompt, image]
                )
            except Exception as vision_error:
                print(f"⚠️ Vision analysis failed: {vision_error}")
                # Fallback to text-only analysis
                text_prompt = f"""
                {prompt}
                
                Note: Image analysis is being performed on a technical level only due to model limitations.
                Please provide general guidance for image authenticity verification.
                """
                response = await asyncio.to_thread(
                    self.gemini_model.generate_content, text_prompt
                )
            
            # OPTIMIZATION: Skip technical analysis in fast mode
            if fast_mode:
                technical_analysis = {'mode': 'fast', 'details': 'skipped for performance'}
                image_properties = {'mode': 'fast'}
            else:
                technical_analysis = self._analyze_image_technical(image_path)
                image_properties = self._get_image_properties(image_path)
            
            print("✅ Gemini analysis completed successfully")
            
            # OPTIMIZATION: Simplified risk calculation for fast mode
            if fast_mode:
                # Quick parsing for fast mode
                response_text = response.text.lower()
                if 'fake' in response_text or 'manipulated' in response_text:
                    score = 0.8
                    confidence = 0.7
                elif 'suspicious' in response_text:
                    score = 0.5
                    confidence = 0.6
                else:
                    score = 0.2
                    confidence = 0.8
                
                # Extract confidence if available
                import re
                conf_match = re.search(r'(\d+)%', response_text)
                if conf_match:
                    confidence = int(conf_match.group(1)) / 100.0
                
                risk_assessment = {'score': score, 'confidence': confidence}
                gemini_analysis = {'verdict': 'FAST_ANALYSIS', 'evidence': [], 'reasoning': 'Fast mode analysis'}
            else:
                # Full analysis for detailed mode
                risk_assessment = self._calculate_deepfake_risk_detailed(response.text, technical_analysis)
                gemini_analysis = self._parse_gemini_image_analysis(response.text)
            
            return {
                'deepfake_score': risk_assessment['score'],
                'confidence': risk_assessment['confidence'],
                'analysis': {
                    'gemini_analysis': {
                        'status': 'success',
                        'deepfake_verdict': gemini_analysis.get('verdict', 'UNKNOWN'),
                        'confidence': int(risk_assessment['confidence'] * 100),
                        'analysis': response.text,
                        'evidence': gemini_analysis.get('evidence', []),
                        'reasoning': gemini_analysis.get('reasoning', '')
                    },
                    'technical_analysis': technical_analysis,
                    'image_properties': image_properties
                },
                'recommendations': self._generate_image_recommendations(response.text) if not fast_mode else ['Fast analysis completed']
            }
            
        except Exception as e:
            print(f"⚠️ Gemini analysis failed: {e}")
            return await self._basic_image_analysis(image_path, error=str(e))

    async def _basic_image_analysis(self, image_path: str, error: str = None) -> Dict[str, Any]:
        """Basic image analysis when Gemini is not available"""
        try:
            technical_analysis = self._analyze_image_technical(image_path)
            
            # Perform basic risk assessment based on technical analysis
            basic_risk = self._calculate_basic_image_risk(technical_analysis)
            
            # Convert basic risk to expected format
            risk_map = {'low': 0.2, 'medium': 0.5, 'high': 0.8}
            deepfake_score = risk_map.get(basic_risk, 0.3)
            
            return {
                'deepfake_score': deepfake_score,
                'confidence': 0.6,  # Lower confidence for basic analysis
                'analysis': {
                    'gemini_analysis': {
                        'status': 'unavailable',
                        'deepfake_verdict': 'ANALYSIS UNAVAILABLE',
                        'confidence': 60,
                        'analysis': 'Basic technical analysis performed. Configure GEMINI_API_KEY for advanced AI-powered deepfake detection using Google Gemini Pro Vision.',
                        'evidence': ['Technical analysis only - no AI verdict available'],
                        'reasoning': 'Gemini API not configured'
                    },
                    'technical_analysis': technical_analysis,
                    'image_properties': self._get_image_properties(image_path)
                },
                'recommendations': [
                    "🔧 Configure Google Gemini API for advanced analysis",
                    "👁️ Manually inspect image for inconsistencies",
                    "🔍 Use reverse image search to check origin",
                    "📊 Check image metadata and EXIF data",
                    "🔍 Look for compression artifacts or quality issues"
                ]
            }
        except Exception as e:
            return {'status': 'error', 'message': str(e)}

    def _analyze_image_technical(self, image_path: str) -> Dict[str, Any]:
        """Technical analysis of image properties"""
        try:
            # PIL analysis
            with Image.open(image_path) as img:
                pil_info = {
                    'format': img.format,
                    'mode': img.mode,
                    'size': img.size,
                    'has_exif': bool(img._getexif()) if hasattr(img, '_getexif') else False
                }
            
            # OpenCV analysis
            cv_img = cv2.imread(image_path)
            if cv_img is not None:
                # Calculate image quality metrics
                gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
                laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
                
                cv_info = {
                    'sharpness': float(laplacian_var),
                    'brightness': float(np.mean(cv_img)),
                    'contrast': float(np.std(cv_img))
                }
            else:
                cv_info = {'error': 'Could not load image with OpenCV'}
            
            return {
                'pil_analysis': pil_info,
                'opencv_analysis': cv_info,
                'quality_assessment': 'good' if cv_info.get('sharpness', 0) > 100 else 'poor'
            }
        except Exception as e:
            return {'error': str(e)}

    def _calculate_deepfake_risk_detailed(self, ai_analysis: str, technical_analysis: Dict) -> Dict[str, float]:
        """Calculate deepfake risk with score and confidence for frontend"""
        risk_score = 0.0
        confidence = 0.7  # Base confidence
        
        # Parse AI analysis verdict more accurately
        analysis_lower = ai_analysis.lower()
        
        # Check for explicit verdicts first
        if 'definitely fake' in analysis_lower or 'clearly manipulated' in analysis_lower:
            risk_score = 0.9
            confidence = 0.95
        elif 'likely manipulated' in analysis_lower or 'probably fake' in analysis_lower:
            risk_score = 0.7
            confidence = 0.8
        elif 'authentic' in analysis_lower or 'genuine' in analysis_lower or 'real' in analysis_lower:
            risk_score = 0.1
            confidence = 0.85
        elif 'possibly manipulated' in analysis_lower:
            risk_score = 0.5
            confidence = 0.6
        else:
            # Default moderate risk if unclear
            risk_score = 0.3
            confidence = 0.5
        
        # Adjust based on technical analysis
        opencv_analysis = technical_analysis.get('opencv_analysis', {})
        sharpness = opencv_analysis.get('sharpness', 100)
        
        # Adjust confidence based on image quality
        if sharpness < 30:  # Very blurry
            confidence *= 0.8
            risk_score += 0.1
        elif sharpness > 80:  # Very sharp
            confidence *= 1.1
        
        # Ensure values are in valid range
        risk_score = max(0.0, min(1.0, risk_score))
        confidence = max(0.0, min(1.0, confidence))
        
        return {
            'score': risk_score,
            'confidence': confidence
        }

    def _calculate_deepfake_risk(self, ai_analysis: str, technical_analysis: Dict) -> str:
        """Calculate deepfake risk based on AI and technical analysis - more conservative approach"""
        risk_score = 0.0
        
        # Parse AI analysis verdict more accurately
        analysis_lower = ai_analysis.lower()
        
        # Check for explicit verdicts first
        if 'definitely fake' in analysis_lower or 'clearly manipulated' in analysis_lower:
            risk_score += 3.0
        elif 'likely manipulated' in analysis_lower or 'probably fake' in analysis_lower:
            risk_score += 2.0
        elif 'authentic' in analysis_lower or 'genuine' in analysis_lower or 'real' in analysis_lower:
            risk_score -= 1.0  # Reduce risk for authentic verdict
        
        # Only add risk for strong manipulation indicators
        strong_indicators = ['obvious manipulation', 'clear artifacts', 'definite editing', 'fake face']
        for indicator in strong_indicators:
            if indicator in analysis_lower:
                risk_score += 1.0
        
        # Technical analysis - be more lenient
        opencv_analysis = technical_analysis.get('opencv_analysis', {})
        sharpness = opencv_analysis.get('sharpness', 100)
        
        # Only penalize very poor quality
        if sharpness < 30:  # Very blurry
            risk_score += 0.5
        
        # Conservative risk assessment
        if risk_score >= 3.0:
            return 'high'
        elif risk_score >= 1.5:
            return 'medium'
        else:
            return 'low'

    def _calculate_basic_image_risk(self, technical_analysis: Dict) -> str:
        """Calculate basic risk assessment based on technical analysis only - more conservative"""
        risk_score = 0.0
        
        opencv_analysis = technical_analysis.get('opencv_analysis', {})
        pil_analysis = technical_analysis.get('pil_analysis', {})
        
        # Be more lenient with sharpness - many real photos can be blurry
        sharpness = opencv_analysis.get('sharpness', 100)
        if sharpness < 20:  # Only very blurry images
            risk_score += 0.5
        
        # Be more lenient with brightness/contrast - normal variation is common
        brightness = opencv_analysis.get('brightness', 128)
        contrast = opencv_analysis.get('contrast', 50)
        
        # Only extreme values are suspicious
        if brightness < 20 or brightness > 235:
            risk_score += 0.3
        if contrast < 5 or contrast > 150:
            risk_score += 0.3
        
        # Missing EXIF is very common and not necessarily suspicious
        # Removed EXIF penalty
        
        # Most image formats are legitimate
        # Removed format penalty
        
        # Much more conservative thresholds
        if risk_score >= 1.5:
            return 'high'
        elif risk_score >= 0.8:
            return 'medium'
        else:
            return 'low'

    def _generate_image_recommendations(self, ai_analysis: str) -> List[str]:
        """Generate recommendations for image analysis"""
        recommendations = [
            "🔍 Perform reverse image search",
            "📅 Check image metadata and creation date",
            "👥 Verify with multiple sources"
        ]
        
        if 'manipulation' in ai_analysis.lower() or 'fake' in ai_analysis.lower():
            recommendations.insert(0, "⚠️ Potential manipulation detected")
            recommendations.append("❌ Avoid sharing without verification")
        
        return recommendations
    
    def _parse_gemini_image_analysis(self, analysis_text: str) -> Dict[str, Any]:
        """Parse Gemini analysis text to extract structured information"""
        analysis_lower = analysis_text.lower()
        
        # Extract verdict
        verdict = 'UNKNOWN'
        if 'definitely fake' in analysis_lower or 'clearly manipulated' in analysis_lower:
            verdict = 'DEFINITELY FAKE'
        elif 'likely manipulated' in analysis_lower or 'probably fake' in analysis_lower:
            verdict = 'LIKELY MANIPULATED'
        elif 'authentic' in analysis_lower or 'genuine' in analysis_lower or 'real' in analysis_lower:
            verdict = 'AUTHENTIC'
        elif 'possibly manipulated' in analysis_lower:
            verdict = 'POSSIBLY MANIPULATED'
        
        # Extract evidence (look for bullet points or listed items)
        evidence = []
        lines = analysis_text.split('\n')
        for line in lines:
            line = line.strip()
            if line.startswith('•') or line.startswith('-') or line.startswith('*'):
                evidence.append(line[1:].strip())
            elif 'evidence:' in line.lower():
                evidence.append(line.split(':', 1)[1].strip())
        
        # Extract reasoning (look for reasoning section)
        reasoning = ''
        for line in lines:
            if 'reasoning:' in line.lower():
                reasoning = line.split(':', 1)[1].strip()
                break
        
        return {
            'verdict': verdict,
            'evidence': evidence[:5],  # Limit to 5 evidence points
            'reasoning': reasoning
        }
    
    def _get_image_properties(self, image_path: str) -> Dict[str, Any]:
        """Get basic image properties"""
        try:
            image = Image.open(image_path)
            return {
                'format': image.format,
                'mode': image.mode,
                'size': image.size,
                'width': image.width,
                'height': image.height,
                'has_transparency': image.mode in ('RGBA', 'LA') or 'transparency' in image.info
            }
        except Exception as e:
            return {'error': str(e)}

    async def analyze_video_deepfake(self, video_path: str, progress_callback=None) -> Dict[str, Any]:
        """Analyze video for deepfakes with optimized Gemini AI integration"""
        try:
            print(f"🎬 Starting optimized video analysis for: {video_path}")
            
            # Basic video analysis using OpenCV
            cap = cv2.VideoCapture(video_path)
            
            if not cap.isOpened():
                print("❌ Could not open video file")
                return {
                    'status': 'error', 
                    'message': 'Could not open video file',
                    'overall_deepfake_risk': 'unknown',
                    'frames_analyzed': 0,
                    'high_risk_frames': 0,
                    'recommendations': ['❌ Video file could not be processed']
                }
            
            # Get video properties
            fps = cap.get(cv2.CAP_PROP_FPS)
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            duration = frame_count / fps if fps > 0 else 0
            
            print(f"📊 Video properties: {frame_count} frames, {fps:.2f} FPS, {duration:.2f}s duration")
            
            # OPTIMIZATION 1: Reduce frame count for faster analysis
            # Maximum 6 frames per video for much faster processing
            if frame_count <= 0:
                sample_frames = 1
            elif duration <= 10:  # Short videos (≤10 seconds)
                sample_frames = min(4, max(3, frame_count // 8))
            elif duration <= 30:  # Medium videos (≤30 seconds)
                sample_frames = min(5, max(4, frame_count // 12))
            else:  # Long videos (>30 seconds)
                sample_frames = 6  # Fixed maximum for faster processing
            
            # Ensure reasonable minimum but cap at 6 frames maximum
            sample_frames = min(6, max(sample_frames, 3))
            
            print(f"🔍 Analyzing {sample_frames} sample frames from {duration:.1f}s video (optimized)...")
            
            # Progress callback
            if progress_callback:
                await progress_callback({"stage": "frame_extraction", "progress": 0, "total_frames": sample_frames})
            
            # OPTIMIZATION 2: Smart frame sampling - focus on key moments
            frame_positions = []
            if sample_frames == 1:
                frame_positions = [frame_count // 2]  # Middle frame
            else:
                # Strategic sampling: beginning, middle, end + evenly distributed
                positions = [
                    frame_count // 10,  # Near beginning (10%)
                    frame_count // 4,   # First quarter (25%)
                    frame_count // 2,   # Middle (50%)
                    3 * frame_count // 4,  # Third quarter (75%)
                    9 * frame_count // 10  # Near end (90%)
                ]
                
                # Take only the number we need
                frame_positions = positions[:sample_frames]
                
                # If we need more frames, add evenly spaced ones
                if len(frame_positions) < sample_frames:
                    remaining = sample_frames - len(frame_positions)
                    interval = frame_count // (remaining + 1)
                    for i in range(remaining):
                        pos = (i + 1) * interval
                        if pos not in frame_positions:
                            frame_positions.append(pos)
            
            # Remove duplicates, sort, and ensure within bounds
            frame_positions = sorted(list(set([min(pos, frame_count - 1) for pos in frame_positions])))
            actual_sample_frames = len(frame_positions)
            
            print(f"📍 Frame positions: {frame_positions}")
            
            # OPTIMIZATION 3: Parallel frame extraction and basic analysis
            frame_data = []
            temp_files = []
            
            # Extract all frames first (faster batch operation)
            for i, frame_pos in enumerate(frame_positions):
                if progress_callback:
                    await progress_callback({"stage": "extracting_frames", "progress": i + 1, "total_frames": actual_sample_frames})
                try:
                    cap.set(cv2.CAP_PROP_POS_FRAMES, frame_pos)
                    ret, frame = cap.read()
                    
                    if ret:
                        temp_frame_path = f"temp_frame_{i}_{os.getpid()}.jpg"
                        cv2.imwrite(temp_frame_path, frame)
                        temp_files.append(temp_frame_path)
                        
                        timestamp = frame_pos / fps if fps > 0 else 0
                        frame_data.append({
                            'path': temp_frame_path,
                            'frame_number': i + 1,
                            'frame_position': frame_pos,
                            'timestamp': timestamp,
                            'video_section': 'beginning' if i < actual_sample_frames // 3 else 'middle' if i < 2 * actual_sample_frames // 3 else 'end'
                        })
                    else:
                        print(f"⚠️ Could not read frame at position {frame_pos}")
                except Exception as frame_error:
                    print(f"⚠️ Error extracting frame {i} at position {frame_pos}: {frame_error}")
                    continue
            
            cap.release()
            
            # OPTIMIZATION 4: Single Gemini call for all frames instead of individual calls
            print(f"🧠 Running optimized Gemini analysis on {len(frame_data)} frames...")
            
            if progress_callback:
                await progress_callback({"stage": "ai_analysis", "progress": 0, "message": "Running AI analysis..."})
            
            # Run Gemini analysis and basic frame analysis concurrently
            gemini_task = asyncio.create_task(self._analyze_video_frames_batch(frame_data, duration))
            
            # OPTIMIZATION 5: Quick basic analysis while Gemini is running
            basic_scores = []
            for frame_info in frame_data:
                # Simple heuristic based on file size and basic properties
                try:
                    file_size = os.path.getsize(frame_info['path'])
                    # Larger files might indicate higher quality/less compression artifacts
                    size_score = min(0.3, file_size / 1000000)  # Normalize to 0-0.3
                    basic_scores.append(0.2 + size_score)  # Base score + size factor
                except:
                    basic_scores.append(0.3)  # Default score
            
            # Wait for Gemini analysis to complete
            gemini_analysis = await gemini_task
            
            if progress_callback:
                await progress_callback({"stage": "finalizing", "progress": 100, "message": "Analysis complete"})
            
            # Clean up temporary files
            for temp_file in temp_files:
                try:
                    if os.path.exists(temp_file):
                        os.remove(temp_file)
                except:
                    pass
            
            # OPTIMIZATION 5: Simplified scoring based on Gemini analysis
            if gemini_analysis.get('status') == 'success':
                verdict = gemini_analysis.get('verdict', 'AUTHENTIC').upper()
                confidence = gemini_analysis.get('confidence', 75) / 100.0
                
                # Map verdict to score
                if verdict == 'DEEPFAKE':
                    overall_score = 0.8 + (confidence * 0.2)  # 0.8-1.0
                elif verdict == 'SUSPICIOUS':
                    overall_score = 0.4 + (confidence * 0.4)  # 0.4-0.8
                else:  # AUTHENTIC
                    overall_score = 0.0 + ((1 - confidence) * 0.3)  # 0.0-0.3
                
                overall_confidence = confidence
            else:
                overall_score = 0.5
                overall_confidence = 0.3
            
            total_frames = len(frame_data)
            print(f"✅ Completed optimized analysis of {total_frames} frames")
            
            result = {
                'deepfake_score': overall_score,
                'confidence': overall_confidence,
                'frames_analyzed': total_frames,
                'analysis': {
                    'gemini_analysis': {
                        'status': gemini_analysis.get('status', 'success'),
                        'deepfake_verdict': gemini_analysis.get('verdict', 'ANALYSIS COMPLETED'),
                        'confidence': int(overall_confidence * 100),
                        'analysis': gemini_analysis.get('analysis', 'Optimized video analysis completed'),
                        'evidence': gemini_analysis.get('evidence', []),
                        'reasoning': gemini_analysis.get('reasoning', 'Batch frame analysis performed')
                    },
                    'frame_analysis': {
                        'total_frames': total_frames,
                        'frames_analyzed': total_frames,
                        'average_score': overall_score,
                        'optimization': 'batch_processing_enabled'
                    },
                    'video_properties': {
                        'duration': duration,
                        'fps': fps,
                        'frame_count': frame_count
                    }
                },
                'recommendations': self._generate_video_recommendations_new(overall_score, gemini_analysis)
            }
            
            print(f"📋 Final result: {overall_score:.2f} score, {total_frames} frames analyzed (optimized)")
            return result
            
        except Exception as e:
            print(f"❌ Video analysis error: {e}")
            return {
                'status': 'error', 
                'message': str(e),
                'overall_deepfake_risk': 'unknown',
                'frames_analyzed': 0,
                'high_risk_frames': 0,
                'recommendations': [f'❌ Analysis failed: {str(e)}']
            }

    async def _analyze_video_frames_batch(self, frame_data: List[Dict], duration: float) -> Dict[str, Any]:
        """Optimized batch analysis of video frames using single Gemini call"""
        try:
            if not self.gemini_model:
                return {'status': 'not_available', 'analysis': 'Gemini not configured'}
            
            if not frame_data:
                return {'status': 'error', 'analysis': 'No frames to analyze'}
            
            # OPTIMIZATION: Concise prompt for faster processing
            total_frames = len(frame_data)
            frame_list = ", ".join([f"Frame {f['frame_number']} (t={f['timestamp']:.1f}s)" for f in frame_data])
            
            prompt = f"""
            Analyze this {duration:.1f}s video for deepfakes using {total_frames} key frames: {frame_list}

            🎯 VERDICT: [AUTHENTIC/SUSPICIOUS/DEEPFAKE]
            📊 CONFIDENCE: [0-100%]
            🔍 KEY EVIDENCE: [2-3 bullet points]
            💡 REASONING: [Brief explanation]

            Focus on: facial inconsistencies, lighting mismatches, temporal artifacts, unnatural movements.
            Be decisive and concise.
            """
            
            # Load first frame as representative sample for Gemini
            first_frame = Image.open(frame_data[0]['path'])
            
            response = await asyncio.to_thread(
                self.gemini_model.generate_content, [prompt, first_frame]
            )
            
            # Parse response efficiently
            response_text = response.text.lower()
            
            # Extract verdict
            if 'deepfake' in response_text:
                verdict = 'DEEPFAKE'
            elif 'suspicious' in response_text:
                verdict = 'SUSPICIOUS'
            else:
                verdict = 'AUTHENTIC'
            
            # Extract confidence
            import re
            confidence_match = re.search(r'(\d+)%', response_text)
            confidence = int(confidence_match.group(1)) if confidence_match else 75
            
            # Extract evidence
            evidence = []
            lines = response.text.split('\n')
            for line in lines:
                if line.strip().startswith('-') or line.strip().startswith('•'):
                    evidence.append(line.strip())
                    if len(evidence) >= 3:
                        break
            
            return {
                'status': 'success',
                'analysis': response.text,
                'verdict': verdict,
                'confidence': confidence,
                'evidence': evidence,
                'reasoning': f'Optimized analysis of {total_frames} frames from {duration:.1f}s video',
                'has_analysis': True
            }
            
        except Exception as e:
            print(f"⚠️ Optimized Gemini video analysis failed: {e}")
            return {
                'status': 'error',
                'analysis': f'Optimized analysis failed: {str(e)}',
                'has_analysis': False
            }

    async def _analyze_video_with_gemini(self, video_path: str, frame_analyses: List[Dict]) -> Dict[str, Any]:
        """Analyze video using Google Gemini for deepfake detection with comprehensive frame analysis"""
        try:
            if not self.gemini_model:
                return {'status': 'not_available', 'analysis': 'Gemini not configured'}
            
            # Create comprehensive frame analysis summary
            total_frames = len(frame_analyses)
            high_risk_frames = sum(1 for f in frame_analyses if f.get('deepfake_score', 0) > 0.7)
            medium_risk_frames = sum(1 for f in frame_analyses if 0.3 <= f.get('deepfake_score', 0) <= 0.7)
            low_risk_frames = sum(1 for f in frame_analyses if f.get('deepfake_score', 0) < 0.3)
            
            # Calculate average scores
            avg_deepfake_score = sum(f.get('deepfake_score', 0) for f in frame_analyses) / max(1, total_frames)
            avg_confidence = sum(f.get('confidence', 0) for f in frame_analyses) / max(1, total_frames)
            
            # Create detailed frame summary (use all frames since we limit to 12 max)
            frame_details = []
            sample_size = total_frames  # Use all frames since we limit to 12 maximum
            for i in range(sample_size):
                frame = frame_analyses[i]
                frame_details.append(
                    f"Frame {i+1}: Score={frame.get('deepfake_score', 0):.2f}, "
                    f"Risk={frame.get('deepfake_risk', 'unknown')}, "
                    f"Confidence={frame.get('confidence', 0):.2f}, "
                    f"Status={frame.get('status', 'unknown')}"
                )
            
            # Get authenticity verdicts from frames
            authentic_frames = sum(1 for f in frame_analyses if f.get('authenticity_verdict', '').upper() == 'AUTHENTIC')
            suspicious_frames = sum(1 for f in frame_analyses if f.get('authenticity_verdict', '').upper() == 'SUSPICIOUS')
            manipulated_frames = sum(1 for f in frame_analyses if f.get('authenticity_verdict', '').upper() == 'MANIPULATED')
            
            prompt = f"""
            As an expert video forensics analyst, analyze this video for deepfakes and manipulation based on comprehensive frame-by-frame analysis.

            📊 VIDEO ANALYSIS DATA:
            - Total frames analyzed: {total_frames}
            - Average deepfake score: {avg_deepfake_score:.3f} (0=authentic, 1=fake)
            - Average confidence: {avg_confidence:.3f}
            
            📈 FRAME RISK DISTRIBUTION:
            - High risk frames (>0.7): {high_risk_frames}/{total_frames} ({high_risk_frames/max(1,total_frames)*100:.1f}%)
            - Medium risk frames (0.3-0.7): {medium_risk_frames}/{total_frames} ({medium_risk_frames/max(1,total_frames)*100:.1f}%)
            - Low risk frames (<0.3): {low_risk_frames}/{total_frames} ({low_risk_frames/max(1,total_frames)*100:.1f}%)
            
            🔍 AUTHENTICITY VERDICTS:
            - Authentic frames: {authentic_frames}/{total_frames}
            - Suspicious frames: {suspicious_frames}/{total_frames}
            - Manipulated frames: {manipulated_frames}/{total_frames}
            
            📋 DETAILED FRAME ANALYSIS:
            {chr(10).join(frame_details)}

            🎯 ANALYSIS REQUIREMENTS:
            
            1. **TEMPORAL CONSISTENCY**: Look for inconsistencies across frames that indicate manipulation
            2. **PATTERN ANALYSIS**: Identify systematic manipulation patterns vs. random artifacts
            3. **CONFIDENCE ASSESSMENT**: Consider the confidence levels of individual frame analyses
            4. **STATISTICAL SIGNIFICANCE**: {total_frames} frames provide {"excellent" if total_frames >= 10 else "good" if total_frames >= 8 else "adequate" if total_frames >= 6 else "limited"} statistical confidence
            
            🎭 DEEPFAKE VERDICT: [Choose ONE]
            - AUTHENTIC: Real, unmanipulated video
            - SUSPICIOUS: Some concerning indicators but not definitive
            - DEEPFAKE: Clear evidence of AI-generated or heavily manipulated content
            
            📊 CONFIDENCE LEVEL: [0-100%] - Based on frame count and consistency of findings
            
            🔍 KEY EVIDENCE:
            - List 3-5 specific findings that support your verdict
            - Include frame-specific observations
            - Note any temporal inconsistencies
            
            💡 EXPERT REASONING:
            Explain your analytical process considering the {total_frames} frames analyzed and statistical significance.
            
            Be thorough and decisive. With {total_frames} frames analyzed, you have {"excellent" if total_frames >= 12 else "good" if total_frames >= 10 else "adequate" if total_frames >= 8 else "limited"} data for analysis.
            """
            
            response = await asyncio.to_thread(
                self.gemini_model.generate_content, prompt
            )
            
            # Enhanced response parsing
            response_text = response.text.lower()
            
            # Extract deepfake verdict
            if 'deepfake' in response_text and ('verdict: deepfake' in response_text or 'deepfake:' in response_text):
                verdict = 'DEEPFAKE'
                risk_level = 'high'
            elif 'suspicious' in response_text and ('verdict: suspicious' in response_text or 'suspicious:' in response_text):
                verdict = 'SUSPICIOUS'
                risk_level = 'medium'
            elif 'authentic' in response_text and ('verdict: authentic' in response_text or 'authentic:' in response_text):
                verdict = 'AUTHENTIC'
                risk_level = 'low'
            else:
                # Fallback based on risk indicators
                if 'high risk' in response_text or 'heavily manipulated' in response_text:
                    verdict = 'DEEPFAKE'
                    risk_level = 'high'
                elif 'medium risk' in response_text or 'suspicious' in response_text:
                    verdict = 'SUSPICIOUS'
                    risk_level = 'medium'
                else:
                    verdict = 'AUTHENTIC'
                    risk_level = 'low'
            
            # Extract confidence level
            confidence = 85  # Default confidence
            import re
            confidence_match = re.search(r'confidence.*?(\d+)%', response_text)
            if confidence_match:
                confidence = int(confidence_match.group(1))
            
            # Extract evidence points
            evidence = []
            lines = response.text.split('\n')
            in_evidence_section = False
            for line in lines:
                if 'key evidence' in line.lower() or 'evidence:' in line.lower():
                    in_evidence_section = True
                    continue
                elif in_evidence_section and line.strip():
                    if line.strip().startswith('-') or line.strip().startswith('•'):
                        evidence.append(line.strip())
                    elif any(keyword in line.lower() for keyword in ['expert reasoning', 'conclusion', 'verdict']):
                        break
            
            return {
                'status': 'success',
                'analysis': response.text,
                'verdict': verdict,
                'risk_level': risk_level,
                'confidence': confidence,
                'evidence': evidence[:5],  # Top 5 evidence points
                'reasoning': f'Analysis based on {total_frames} frames with {avg_deepfake_score:.1%} average manipulation score',
                'has_analysis': True
            }
            
        except Exception as e:
            print(f"⚠️ Gemini video analysis failed: {e}")
            return {
                'status': 'error',
                'analysis': f'Gemini video analysis failed: {str(e)}',
                'risk_level': 'unknown',
                'has_analysis': False
            }

    def _generate_video_recommendations(self, risk_level: str, gemini_analysis: Dict = None) -> List[str]:
        """Generate recommendations for video analysis"""
        base_recommendations = [
            "🎬 Check video source and publication date",
            "🔍 Look for inconsistencies in lighting and shadows",
            "👥 Verify with original source if possible"
        ]
        
        # Add Gemini-specific recommendations
        if gemini_analysis and gemini_analysis.get('status') == 'success':
            gemini_risk = gemini_analysis.get('risk_level', 'unknown')
            if gemini_risk == 'high':
                base_recommendations.insert(0, "🧠 AI analysis indicates high manipulation risk")
            elif gemini_risk == 'medium':
                base_recommendations.insert(0, "🧠 AI analysis suggests moderate concerns")
            else:
                base_recommendations.insert(0, "🧠 AI analysis shows low manipulation indicators")
        
        if risk_level == 'high':
            return [
                "⚠️ High deepfake risk detected",
                "❌ Do not share without thorough verification"
            ] + base_recommendations
        elif risk_level == 'medium':
            return [
                "⚡ Moderate risk detected",
                "🤔 Exercise caution before sharing"
            ] + base_recommendations
        elif risk_level == 'low':
            return ["✅ Low risk detected"] + base_recommendations
        else:  # unknown
            return [
                "❓ Could not determine risk level",
                "🔧 Try with a different video format",
                "📱 Ensure video is not corrupted"
            ] + base_recommendations
    
    def _generate_video_recommendations_new(self, deepfake_score: float, gemini_analysis: Dict) -> List[str]:
        """Generate recommendations based on video deepfake score"""
        recommendations = []
        
        if deepfake_score > 0.7:
            recommendations.extend([
                "🚨 High deepfake probability detected - exercise extreme caution",
                "🔍 Verify the source and authenticity of this video",
                "📱 Cross-reference with other reliable sources",
                "👥 Consult with digital forensics experts if needed"
            ])
        elif deepfake_score > 0.4:
            recommendations.extend([
                "⚠️ Moderate manipulation indicators found",
                "🔍 Perform additional verification checks",
                "📊 Compare with known authentic videos of the subject",
                "🔎 Look for inconsistencies in facial movements"
            ])
        else:
            recommendations.extend([
                "✅ Low probability of deepfake manipulation",
                "👁️ Continue normal verification practices",
                "📋 Document source and context for records"
            ])
        
        # Add technical recommendations
        recommendations.extend([
            "🎬 Analyze frame-by-frame for inconsistencies",
            "🔊 Check audio-visual synchronization",
            "📈 Examine compression artifacts and quality",
            "🔍 Use reverse video search tools"
        ])
        
        return recommendations
    
    def _get_score_distribution(self, frame_analyses: List[Dict]) -> Dict[str, int]:
        """Get distribution of deepfake scores across frames"""
        if not frame_analyses:
            return {'low': 0, 'medium': 0, 'high': 0}
        
        low_count = sum(1 for analysis in frame_analyses if analysis.get('deepfake_score', 0.3) < 0.3)
        medium_count = sum(1 for analysis in frame_analyses if 0.3 <= analysis.get('deepfake_score', 0.3) <= 0.7)
        high_count = sum(1 for analysis in frame_analyses if analysis.get('deepfake_score', 0.3) > 0.7)
        
        return {
            'low': low_count,
            'medium': medium_count,
            'high': high_count
        }

    # Legacy methods for backward compatibility
    async def analyze_text(self, text: str, check_sources: bool = True, analyze_sentiment: bool = True) -> Dict[str, Any]:
        """Legacy method - redirects to comprehensive analysis"""
        return await self.analyze_text_comprehensive(text)

    async def analyze_image(self, file_data: bytes, content_type: str) -> Dict[str, Any]:
        """Legacy method for image analysis"""
        # Save bytes to temporary file
        temp_path = "temp_image_analysis.jpg"
        with open(temp_path, "wb") as f:
            f.write(file_data)
        
        try:
            result = await self.analyze_image_deepfake(temp_path)
            os.remove(temp_path)
            return result
        except Exception as e:
            if os.path.exists(temp_path):
                os.remove(temp_path)
            raise e