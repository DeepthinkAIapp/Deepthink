import os
import json
import base64
import httpx
from typing import Optional, Dict, Any
from PIL import Image
import io
import logging
import tempfile
from gradio_client import Client, handle_file

logger = logging.getLogger('DeepThinkAI')

# MiniGPT-4 Configuration
MINIGPT4_URL = os.getenv("MINIGPT4_URL", "http://localhost:7860")
MINIGPT4_TIMEOUT = int(os.getenv("MINIGPT4_TIMEOUT", "300"))  # 5 minutes timeout

async def process_image_for_minigpt4(image_data: str) -> str:
    """
    Process and validate image for MiniGPT-4.
    Returns the processed image data in base64 format.
    """
    try:
        # Remove data URL prefix if present
        if image_data.startswith('data:image'):
            image_data = image_data.split(',')[1]
        
        # Decode base64 image
        image_bytes = base64.b64decode(image_data)
        
        # Open and validate image
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Resize if too large (MiniGPT-4 has a size limit)
        max_size = 1024
        if max(image.size) > max_size:
            ratio = max_size / max(image.size)
            new_size = tuple(int(dim * ratio) for dim in image.size)
            image = image.resize(new_size, Image.Resampling.LANCZOS)
        
        # Convert back to base64
        buffered = io.BytesIO()
        image.save(buffered, format="JPEG", quality=95)
        return base64.b64encode(buffered.getvalue()).decode()
    
    except Exception as e:
        logger.error(f"Error processing image for MiniGPT-4: {str(e)}")
        raise ValueError("Invalid image format or processing error")

async def call_minigpt4(prompt: str, image_data: Optional[str] = None) -> Dict[str, Any]:
    """
    Call MiniGPT-4 API with the given prompt and optional image.
    Returns the model's response.
    """
    try:
        async with httpx.AsyncClient(timeout=MINIGPT4_TIMEOUT) as client:
            payload = {
                "prompt": prompt,
                "image": image_data if image_data else None
            }
            
            response = await client.post(
                f"{MINIGPT4_URL}/api/chat",
                json=payload
            )
            
            if response.status_code != 200:
                raise Exception(f"MiniGPT-4 API error: {response.text}")
            
            return response.json()
    
    except Exception as e:
        logger.error(f"Error calling MiniGPT-4: {str(e)}")
        raise

async def stream_minigpt4_response(prompt: str, image_data: Optional[str] = None):
    """
    Stream response from MiniGPT-4.
    Yields chunks of the response as they become available.
    Handles both streaming and non-streaming responses.
    """
    try:
        async with httpx.AsyncClient(timeout=MINIGPT4_TIMEOUT) as client:
            payload = {
                "prompt": prompt,
                "image": image_data if image_data else None,
                "stream": True
            }
            
            async with client.stream('POST', f"{MINIGPT4_URL}/api/chat", json=payload) as response:
                # If not 200, read the error and yield
                if response.status_code != 200:
                    error_text = await response.aread()
                    yield {"error": f"MiniGPT-4 API error: {error_text.decode('utf-8', errors='replace')}"}
                    return
                # Check if the response is actually a stream
                content_type = response.headers.get("content-type", "")
                if "text/event-stream" not in content_type and "application/json" in content_type:
                    # Not a stream, just a JSON response
                    data = await response.aread()
                    try:
                        data_json = json.loads(data)
                        formatted_response = {
                            "message": {
                                "content": data_json.get("response", "")
                            }
                        }
                        yield formatted_response
                    except Exception as e:
                        yield {"error": f"MiniGPT-4 non-streaming response error: {str(e)}"}
                    return
                # Otherwise, treat as a stream
                async for chunk in response.aiter_text():
                    if chunk.strip():
                        try:
                            data = json.loads(chunk)
                            formatted_response = {
                                "message": {
                                    "content": data.get("response", "")
                                }
                            }
                            yield formatted_response
                        except json.JSONDecodeError:
                            continue
    except Exception as e:
        logger.error(f"Error streaming MiniGPT-4 response: {str(e)}")
        yield {"error": str(e)}

def ensure_tuple_list(state):
    if not isinstance(state, list):
        return []
    result = []
    for item in state:
        if isinstance(item, tuple) and len(item) == 2:
            result.append(item)
        elif isinstance(item, list) and len(item) == 2:
            result.append(tuple(item))
        elif isinstance(item, dict):
            # Try to extract text fields if present
            user = item.get('user', None)
            ai = item.get('ai', None)
            if user is not None or ai is not None:
                result.append((user, ai))
        # else: skip
    return result

async def call_minigpt4_gradio(prompt: str, image_b64: str) -> str:
    """
    Calls the MiniGPT-4 Gradio API using gradio_client and the /gradio_reset, /upload_img, /gradio_ask, and /gradio_answer endpoints.
    """
    # Decode base64 image and save to a temporary file
    with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
        tmp.write(base64.b64decode(image_b64.split(',')[-1]))
        tmp.flush()
        image_path = tmp.name
    try:
        client = Client("http://127.0.0.1:7860/")
        # Step 0: Reset the chatbot state
        client.predict(api_name="/gradio_reset")
        # Step 1: Upload the image
        upload_result = client.predict(
            gr_img=handle_file(image_path),
            text_input=prompt,
            api_name="/upload_img"
        )
        chatbot_state = ensure_tuple_list(upload_result[1]) if isinstance(upload_result, (list, tuple)) and len(upload_result) > 1 else []
        # Step 2: Send the prompt and chatbot state to /gradio_ask
        ask_result = client.predict(
            user_message=prompt,
            chatbot=chatbot_state,
            api_name="/gradio_ask"
        )
        updated_chatbot_state = ensure_tuple_list(ask_result[1]) if isinstance(ask_result, (list, tuple)) and len(ask_result) > 1 else []
        # Step 3: Get the AI's response from /gradio_answer
        answer_result = client.predict(
            chatbot=updated_chatbot_state,
            num_beams=1,
            temperature=1,
            api_name="/gradio_answer"
        )
        return answer_result[0] if isinstance(answer_result, (list, tuple)) else str(answer_result)
    finally:
        os.remove(image_path) 