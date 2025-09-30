import asyncio
import aiohttp
import os
from dotenv import dotenv_values

# Load environment variables
env_path = os.path.join(os.getcwd(), ".env")
if os.path.exists(env_path):
    values = dotenv_values(env_path)
    for key, value in values.items():
        if value is not None:
            os.environ[key] = str(value)

async def test_newsapi():
    api_key = os.getenv('NEWSAPI_KEY')
    print(f"NewsAPI Key: {api_key}")
    
    try:
        url = "https://newsapi.org/v2/everything"
        params = {
            'apiKey': api_key,
            'q': 'test',
            'pageSize': 1,
            'language': 'en'
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params, timeout=10) as response:
                print(f"NewsAPI Status: {response.status}")
                if response.status == 200:
                    data = await response.json()
                    print(f"NewsAPI Working: Found {len(data.get('articles', []))} articles")
                else:
                    text = await response.text()
                    print(f"NewsAPI Error: {text}")
    except Exception as e:
        print(f"NewsAPI Exception: {e}")

async def test_factcheck():
    api_key = os.getenv('FACTCHECK_API_KEY')
    print(f"FactCheck Key: {api_key}")
    
    try:
        url = "https://factchecktools.googleapis.com/v1alpha1/claims:search"
        params = {
            'key': api_key,
            'query': 'test',
            'languageCode': 'en'
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params, timeout=10) as response:
                print(f"FactCheck Status: {response.status}")
                if response.status == 200:
                    data = await response.json()
                    print(f"FactCheck Working: Found {len(data.get('claims', []))} claims")
                else:
                    text = await response.text()
                    print(f"FactCheck Error: {text}")
    except Exception as e:
        print(f"FactCheck Exception: {e}")

async def main():
    print("Testing APIs...")
    await test_newsapi()
    print()
    await test_factcheck()

if __name__ == "__main__":
    asyncio.run(main())