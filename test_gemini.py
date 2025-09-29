import google.generativeai as genai
import os
from dotenv import dotenv_values

# Load environment variables
env_path = os.path.join(os.getcwd(), ".env")
if os.path.exists(env_path):
    values = dotenv_values(env_path)
    for key, value in values.items():
        if value is not None:
            os.environ[key] = str(value)

# Test Gemini API
api_key = os.getenv('GEMINI_API_KEY')
print(f"API Key: {api_key}")

try:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-2.5-flash')
    
    response = model.generate_content("Hello, can you respond with 'API is working'?")
    print(f"Response: {response.text}")
    print("✅ Gemini API is working!")
    
except Exception as e:
    print(f"❌ Error: {e}")