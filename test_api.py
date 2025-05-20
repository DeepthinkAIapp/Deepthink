import requests

def test_chat_endpoint():
    url = "http://localhost:8000/api/chat"
    payload = {
        "messages": [
            {
                "role": "user",
                "content": "Hello, are you working?"
            }
        ],
        "model": "mistral:latest"
    }
    
    try:
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    test_chat_endpoint() 