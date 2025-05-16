import httpx
import asyncio
import json

async def test_ollama():
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://127.0.0.1:11434/api/chat",
            json={
                "model": "gemma:7b",
                "messages": [{"role": "user", "content": "Hello"}],
                "stream": True
            }
        )
        print(f"Status code: {response.status_code}")
        async for chunk in response.aiter_text():
            print(f"Received chunk: {chunk}")

if __name__ == "__main__":
    asyncio.run(test_ollama()) 