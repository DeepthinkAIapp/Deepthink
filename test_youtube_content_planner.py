import requests

url = 'http://localhost:8000/api/youtube-content-planner'
data = {
    'prompt': 'Generate content ideas for YouTube',
    'niche': 'Technology',
    'subniche': None
}

response = requests.post(url, json=data)
print(response.json()) 