import requests
import sys

print("Sending test request to Swagger docs...")
try:
    r = requests.get("http://127.0.0.1:8000/docs", timeout=5)
    print(f"Success! Status code: {r.status_code}")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
