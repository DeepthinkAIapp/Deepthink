import requests
import time

def test_generate():
    try:
        # Try up to 3 times with a delay
        for attempt in range(3):
            try:
                resp = requests.post(
                    'http://localhost:8000/api/generate',
                    json={'model': 'gemma:7b', 'prompt': 'Say hello!'},
                    timeout=5
                )
                print(f"Status Code: {resp.status_code}")
                print(f"Response: {resp.text}")
                return
            except requests.exceptions.ConnectionError:
                if attempt < 2:  # Don't sleep on the last attempt
                    print(f"Attempt {attempt + 1} failed. Retrying in 2 seconds...")
                    time.sleep(2)
                else:
                    raise
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    test_generate() 