import requests

def test_servers():
    # Test FastAPI backend
    try:
        response = requests.get('http://localhost:8000/')
        print("FastAPI Backend (8000):")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}\n")
    except Exception as e:
        print(f"FastAPI Backend Error: {str(e)}\n")

    # Test RAG server
    try:
        response = requests.get('http://localhost:8001/')
        print("RAG Server (8001):")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"RAG Server Error: {str(e)}")

if __name__ == "__main__":
    test_servers() 