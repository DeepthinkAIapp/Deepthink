import httpx
import json
import time
from typing import AsyncGenerator

async def generate() -> AsyncGenerator[str, None]:
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            start_time = time.time()
            async with client.stream(
                "POST",
                OLLAMA_API_URL,
                json={
                    "model": selected_model,
                    "messages": [{"role": m.role, "content": m.content} for m in processed_messages],
                    "stream": True
                }
            ) as stream:
                async for chunk in stream:
                    if chunk.status_code == 200:
                        try:
                            data = json.loads(chunk.text)
                            if "message" in data:
                                yield data["message"]["content"]
                        except json.JSONDecodeError:
                            continue
            MODEL_RESPONSE_TIME.labels(model=selected_model).observe(time.time() - start_time)
    finally:
        ACTIVE_REQUESTS.dec() 