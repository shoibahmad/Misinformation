import requests
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv('FACTCHECK_API_KEY')
print(f"API Key: {api_key}")

# Test basic API connectivity
url = f"https://factchecktools.googleapis.com/v1alpha1/claims:search?key={api_key}"
params = {
    'query': 'climate change',
    'languageCode': 'en'
}

try:
    response = requests.get(url, params=params, timeout=10)
    print(f"Status Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    print(f"Response Text: {response.text}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Success! Found {len(data.get('claims', []))} claims")
    else:
        print(f"Error: {response.status_code}")
        
except Exception as e:
    print(f"Exception: {e}")