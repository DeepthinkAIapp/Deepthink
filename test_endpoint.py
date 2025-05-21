import requests

def test_backlink_forms():
    url = 'http://localhost:8000/api/backlink/forms'
    data = {'domain': 'example.com'}
    
    try:
        response = requests.post(url, json=data)
        print(f'Status Code: {response.status_code}')
        print(f'Response: {response.json()}')
    except Exception as e:
        print(f'Error: {str(e)}')

if __name__ == '__main__':
    test_backlink_forms() 