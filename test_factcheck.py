import asyncio
import aiohttp
import os
from dotenv import load_dotenv

load_dotenv()

async def test_factcheck_api():
    """Test the Fact Check API with the updated key"""
    api_key = os.getenv('FACTCHECK_API_KEY')
    
    if not api_key:
        print("FACTCHECK_API_KEY not found in environment")
        return
    
    print(f"Using API Key: {api_key[:20]}...")
    
    # Test query
    query = "COVID-19 vaccine"
    url = "https://factchecktools.googleapis.com/v1alpha1/claims:search"
    params = {
        'key': api_key,
        'query': query,
        'languageCode': 'en'
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            print(f"Testing query: '{query}'")
            async with session.get(url, params=params, timeout=10) as response:
                print(f"Response Status: {response.status}")
                
                if response.status == 200:
                    data = await response.json()
                    claims = data.get('claims', [])
                    print(f"SUCCESS: Found {len(claims)} claims")
                    
                    if claims:
                        print(f"Sample claim: {claims[0].get('text', 'No text')[:100]}...")
                    else:
                        print("No claims found for this query")
                        
                elif response.status == 400:
                    error_data = await response.json()
                    print(f"BAD REQUEST: {error_data}")
                elif response.status == 403:
                    print("FORBIDDEN: API key may be invalid or lacks permissions")
                elif response.status == 429:
                    print("RATE LIMITED: Too many requests")
                else:
                    error_text = await response.text()
                    print(f"ERROR {response.status}: {error_text}")
                    
    except Exception as e:
        print(f"EXCEPTION: {e}")

if __name__ == "__main__":
    asyncio.run(test_factcheck_api())