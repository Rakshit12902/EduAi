import requests

# We need a valid JWT token to test this, which is hard.
# Let's just send a request without auth to see if we get 401 or network error.
try:
    resp = requests.post('http://localhost:8000/api/v1/chats/', json={"title": "test"})
    print("Status:", resp.status_code)
    print("Body:", resp.text)
except Exception as e:
    print("Error:", e)
