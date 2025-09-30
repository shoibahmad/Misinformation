import asyncio
import sys
import os
sys.path.append(os.path.dirname(__file__))

from analyzer import MisinformationAnalyzer

async def test_factcheck():
    analyzer = MisinformationAnalyzer()
    
    print("Testing Fact Check API...")
    print(f"API Key configured: {'Yes' if analyzer.factcheck_api_key else 'No'}")
    
    if analyzer.factcheck_api_key:
        print(f"API Key: {analyzer.factcheck_api_key[:20]}...")
    
    # Test with simple query
    result = await analyzer._check_facts_api("COVID-19 vaccine safety")
    
    print(f"Result: {result}")
    
    if result.get('error'):
        print(f"ERROR: {result['error']}")
    else:
        print(f"SUCCESS: Found {result.get('claims_found', 0)} claims")

if __name__ == "__main__":
    asyncio.run(test_factcheck())