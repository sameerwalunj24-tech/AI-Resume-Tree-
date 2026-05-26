import requests
import json
import os

url = "http://127.0.0.1:8000/evaluate"

# Read sample JD and resume
resume_path = r"d:\AI-Resume-Tree-main\dataset\resumes\resume_01.txt"
jd_path = r"d:\AI-Resume-Tree-main\dataset\jds\jd_01_software_engineer.txt"

with open(jd_path, "r", encoding="utf-8") as f:
    jd_text = f.read()

print("Sending request to /evaluate...")
with open(resume_path, "rb") as f:
    files = {
        "resume": (os.path.basename(resume_path), f, "text/plain")
    }
    data = {
        "jd_text": jd_text
    }
    response = requests.post(url, files=files, data=data)

print(f"Status Code: {response.status_code}")
if response.status_code == 200:
    res_data = response.json()
    print("\nKeys in response:")
    print(list(res_data.keys()))
    
    print("\nFeedback keys:")
    feedback = res_data.get("feedback", {})
    print(list(feedback.keys()))
    
    print("\nFeedback structure:")
    print(json.dumps(feedback, indent=2))
else:
    print(response.text)
