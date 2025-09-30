import asyncio
from analyzer import MisinformationAnalyzer

async def test_factcheck():
    analyzer = MisinformationAnalyzer()
    
    # Test the fact-check function directly
    result = await analyzer._check_facts_api("climate change is a hoax")
    print("Fact check result:")
    print(result)
    
    # Test full text analysis
    print("\n" + "="*50)
    print("Full text analysis:")
    full_result = await analyzer.analyze_text_comprehensive("climate change is a hoax")
    print("Fact check section:", full_result.get('analysis', {}).get('fact_check', {}))

if __name__ == "__main__":
    asyncio.run(test_factcheck())