import asyncio
from analyzer import MisinformationAnalyzer

async def test_text_analysis():
    try:
        print("🔍 Initializing analyzer...")
        analyzer = MisinformationAnalyzer()
        print("✅ Analyzer initialized successfully")
        
        test_text = "Breaking news: Scientists discover miracle cure that doctors don't want you to know!"
        print(f"📝 Testing with text: {test_text}")
        
        print("🚀 Starting analysis...")
        result = await analyzer.analyze_text_comprehensive(test_text)
        
        print("✅ Analysis completed!")
        print(f"📊 Misinformation score: {result.get('misinformation_score', 'N/A')}")
        print(f"🎯 Confidence: {result.get('confidence', 'N/A')}")
        
        # Check each analysis component
        analysis = result.get('analysis', {})
        print("\n📋 Analysis components:")
        for key, value in analysis.items():
            if isinstance(value, dict):
                status = value.get('status', 'unknown')
                error = value.get('error', None)
                print(f"  - {key}: {status}" + (f" (Error: {error})" if error else ""))
            else:
                print(f"  - {key}: {type(value).__name__}")
        
        return result
        
    except Exception as e:
        print(f"❌ Error during test: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    asyncio.run(test_text_analysis())