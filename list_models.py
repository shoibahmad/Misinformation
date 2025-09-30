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

api_key = os.getenv('GEMINI_API_KEY')
print(f"API Key: {api_key}")

try:
    genai.configure(api_key=api_key)
    
    print("Available models:")
    for model in genai.list_models():
        print(f"- {model.name}")
        
except Exception as e:
    print(f"Error: {e}")