import urllib.request
import json

try:
    with urllib.request.urlopen('http://127.0.0.1:8000/api/roles/') as response:
        data = json.loads(response.read().decode())
        print("Status: 200")
        print("Response:", json.dumps(data, indent=2))
except Exception as e:
    print("Error:", e)