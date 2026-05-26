import os
import sys
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
api_key = os.environ.get("GEMINI_API_KEY")
print(f"API Key: {api_key}")

try:
    print("Initializing client with SSL verification disabled...")
    http_options = types.HttpOptions(
        timeout=30000,
        client_args={"verify": False}
    )
    client = genai.Client(
        api_key=api_key,
        http_options=http_options
    )
    print("Sending generateContent request...")
    response = client.models.generate_content(
        model="gemini-2.5-flash-lite",
        contents="Say Hello!"
    )
    print(f"API response: {response.text}")
except Exception as e:
    print(f"API call failed: {str(e)}")
