#!/usr/bin/env python3
"""
Test script to verify Gemini API fallback mechanism
"""

import os
import asyncio
from analyzer import MisinformationAnalyzer

async def test_gemini_fallback():
    """Test the Gemini API fallback functionality"""
    print("🧪 Testing Gemini API fallback mechanism...")
    
    # Initialize analyzer
    analyzer = MisinformationAnalyzer()
    
    # Check if both API keys are configured
    print(f"Primary API key: {'✅ Set' if analyzer.gemini_api_key else '❌ Not set'}")
    print(f"Backup API key: {'✅ Set' if analyzer.gemini_api_key_backup else '❌ Not set'}")
    print(f"Current active key: {analyzer.current_gemini_key[:20]}...")
    
    # Test with a simple text analysis
    test_text = "This is a test message to verify the Gemini API is working correctly."
    
    try:
        print("\n🔍 Testing text analysis with current API key...")
        result = await analyzer.analyze_text_comprehensive(test_text)
        print("✅ Text analysis successful!")
        print(f"Verdict: {result.get('fake_news_verdict', 'N/A')}")
        
    except Exception as e:
        print(f"❌ Text analysis failed: {e}")
        
    print(f"\nFinal active key: {analyzer.current_gemini_key[:20]}...")

if __name__ == "__main__":
    asyncio.run(test_gemini_fallback())