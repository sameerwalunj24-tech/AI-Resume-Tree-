import os
import sys
from google import genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.environ.get("GEMINI_API_KEY")
print(f"Using API Key: {api_key}")

if not api_key:
    print("No GEMINI_API_KEY found in env!")
    sys.exit(1)

try:
    print("Initializing client...")
    client = genai.Client(api_key=api_key)
    print("Sending generateContent request...")
    response = client.models.generate_content(
        model="gemini-flash-latest",
        contents="Say Hello!"
    )
    print(f"API response text: {response.text}")
except Exception as e:
    print(f"API call failed: {str(e)}")
