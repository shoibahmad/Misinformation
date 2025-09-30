import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

def test_gemini_models():
    """Test available Gemini models"""
    api_key = os.getenv('GEMINI_API_KEY')
    
    if not api_key:
        print("GEMINI_API_KEY not found")
        return
    
    try:
        genai.configure(api_key=api_key)
        
        # List available models
        print("Available Gemini models:")
        for model in genai.list_models():
            if 'generateContent' in model.supported_generation_methods:
                print(f"- {model.name}")
        
        # Test specific models
        models_to_test = [
            'gemini-1.5-flash',
            'gemini-1.5-pro',
            'gemini-pro',
            'gemini-pro-vision'
        ]
        
        for model_name in models_to_test:
            try:
                model = genai.GenerativeModel(model_name)
                response = model.generate_content("Hello")
                print(f"✓ {model_name}: Working")
            except Exception as e:
                print(f"✗ {model_name}: {e}")
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_gemini_models()