from fastapi import FastAPI, HTTPException, Depends, status, BackgroundTasks, Request, Body, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pydantic import BaseModel, Field, validator, field_validator
from typing import List, Optional, AsyncGenerator, Dict, Tuple, Any
import httpx
import json
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import os
from dotenv import load_dotenv
import aiosqlite
import asyncio
import uuid
import socket
import re
import nltk
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
import spacy
from textblob import TextBlob
import emoji
import contractions
import string
import logging
from fastapi.exception_handlers import RequestValidationError
from fastapi.exceptions import RequestValidationError as FastAPIRequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from transformers import pipeline
from spellchecker import SpellChecker
import contextlib
import wordninja
import time
from functools import wraps
from aiosqlite import Connection
from contextlib import asynccontextmanager
import backoff
from prometheus_client import Counter, Histogram, Gauge, REGISTRY
from prometheus_fastapi_instrumentator import Instrumentator
import pathlib
import requests
import base64
from fastapi.staticfiles import StaticFiles
from PIL import Image, ImageStat
import io
from fastapi import APIRouter
import shutil
import sys
sys.path.append(str(pathlib.Path(__file__).parent.parent / 'deepthink-link-builder' / 'modules'))
import scraper
import selenium_submitter
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.edge.options import Options as EdgeOptions
from selenium.webdriver.common.by import By
from selenium.common.exceptions import WebDriverException
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import WebDriverException
from webdriver_manager.microsoft import EdgeChromiumDriverManager
from selenium.webdriver.edge.service import Service
import random
from ahrefs_scraper import router as ahrefs_router
from minigpt4_integration import process_image_for_minigpt4, stream_minigpt4_response, call_minigpt4_gradio
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

# Create FastAPI app instance
app = FastAPI(title="DeepThinkAI API", version="1.0.0")

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    handlers=[
        logging.FileHandler('deepthinkai.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('DeepThinkAI')

class Message(BaseModel):
    role: str = Field(..., min_length=1, max_length=50)
    content: str = Field(..., min_length=1, max_length=10000)
    sentiment: Optional[float] = Field(None, ge=-1.0, le=1.0)
    entities: Optional[List[Dict]] = None
    intent: Optional[str] = None

    @field_validator('role')
    @classmethod
    def validate_role(cls, v: str) -> str:
        allowed_roles = ['user', 'assistant', 'system']
        if v not in allowed_roles:
            raise ValueError(f'Role must be one of {allowed_roles}')
        return v

class EnhancedChatRequest(BaseModel):
    model: Optional[str] = Field('mistral:latest', min_length=1, max_length=50)
    messages: List[Message] = Field(..., min_items=1)
    context: Optional[Dict] = None
    image: Optional[str] = None

    @validator('messages')
    def validate_messages(cls, v):
        if not v:
            raise ValueError('At least one message is required')
        return v

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class RequestContextFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        if hasattr(record, 'request_id'):
            return True
        record.request_id = 'startup'
        return True

# Lazy-load spaCy model
def get_nlp():
    global _nlp
    try:
        return _nlp
    except NameError:
        pass
    try:
        _nlp = spacy.load('en_core_web_sm')
    except OSError:
        spacy.cli.download('en_core_web_sm')
        _nlp = spacy.load('en_core_web_sm')
    return _nlp

# Lazy-load NLTK data
def ensure_nltk_data():
    import nltk
    for pkg in ['punkt', 'stopwords', 'wordnet', 'averaged_perceptron_tagger']:
        try:
            nltk.data.find(f'tokenizers/{pkg}')
        except LookupError:
            nltk.download(pkg)

# Load environment variables
load_dotenv()

# Security configuration
SECRET_KEY = os.getenv("SECRET_KEY", "deepthink_ai_secure_key_2024")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable is not set")

# API Configuration
OLLAMA_API_URL = os.getenv("OLLAMA_API_URL", "http://127.0.0.1:11434/api/chat")
OLLAMA_TIMEOUT = float(os.getenv("OLLAMA_TIMEOUT", "30.0"))
OLLAMA_MAX_RETRIES = int(os.getenv("OLLAMA_MAX_RETRIES", "3"))

# Stable Diffusion WebUI URL
SD_WEBUI_URL = "http://127.0.0.1:7860"

# Database Configuration
DB_DIR = pathlib.Path(__file__).parent.absolute()
DATABASE_URL = str(DB_DIR / "chat.db")
MAX_CONNECTIONS = int(os.getenv("MAX_CONNECTIONS", "10"))
DB_TIMEOUT = float(os.getenv("DB_TIMEOUT", "30.0"))

# Rate Limiting
RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", "10"))
RATE_LIMIT_PERIOD = int(os.getenv("RATE_LIMIT_PERIOD", "60"))

# Request Configuration
MAX_REQUEST_SIZE = int(os.getenv("MAX_REQUEST_SIZE", "104857600"))  # 100MB in bytes
REQUEST_TIMEOUT = 300.0  # 5 minutes

# CORS Configuration
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8000",
    "https://www.deepthinkai.app",
    "https://deepthinkai.app",
    "https://deepthinkai.vercel.app",
    "https://deepthinkapp.onrender.com"  # Add Render domain
]

app.state.cors_origins = ALLOWED_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600
)

# Add CORS preflight handler
@app.options("/{full_path:path}")
async def options_handler(request: Request, full_path: str):
    origin = request.headers.get("origin")
    if origin in app.state.cors_origins:
        return JSONResponse(
            status_code=200,
            headers={
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Max-Age": "3600",
            }
        )
    return JSONResponse(status_code=400, content={"detail": "Invalid origin"})

# Enhanced error handling for CORS
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    origin = request.headers.get("origin")
    headers = {}
    if origin in app.state.cors_origins:
        headers = {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
        }
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
        headers=headers
    )

# Enhanced validation error handler with CORS headers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"Validation error: {exc}", exc_info=True)
    origin = request.headers.get("origin")
    headers = {}
    if origin in app.state.cors_origins:
        headers = {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
        }
    return JSONResponse(
        status_code=422,
        content={"detail": f"Validation error: {str(exc)}"},
        headers=headers
    )

# Request timeout middleware
@app.middleware("http")
async def timeout_middleware(request: Request, call_next):
    try:
        return await asyncio.wait_for(call_next(request), timeout=REQUEST_TIMEOUT)
    except asyncio.TimeoutError:
        return JSONResponse(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            content={"detail": "Request timeout"}
        )

# Request size limit middleware
@app.middleware("http")
async def request_size_middleware(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_REQUEST_SIZE:
        return JSONResponse(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            content={"detail": "Request entity too large"}
        )
    return await call_next(request)

# Metrics configuration
REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total number of HTTP requests',
    ['method', 'endpoint', 'status']
)

REQUEST_LATENCY = Histogram(
    'http_request_duration_seconds',
    'HTTP request latency in seconds',
    ['method', 'endpoint']
)

ACTIVE_REQUESTS = Gauge(
    'active_requests',
    'Number of active requests'
)

DB_OPERATION_LATENCY = Histogram(
    'db_operation_duration_seconds',
    'Database operation latency in seconds',
    ['operation']
)

MODEL_RESPONSE_TIME = Histogram(
    'model_response_time_seconds',
    'AI model response time in seconds',
    ['model']
)

ERROR_COUNT = Counter(
    'error_count_total',
    'Total number of errors',
    ['type', 'endpoint']
)

# Ensure database directory exists
os.makedirs(DB_DIR, exist_ok=True)

# Database connection pool
class DatabasePool:
    def __init__(self, db_path: str, max_connections: int = MAX_CONNECTIONS):
        self.db_path = db_path
        self.max_connections = max_connections
        self.pool: List[Connection] = []
        self._lock = asyncio.Lock()

    async def initialize(self):
        """Initialize the connection pool"""
        try:
            for _ in range(self.max_connections):
                conn = await aiosqlite.connect(self.db_path, timeout=DB_TIMEOUT)
                await conn.execute("PRAGMA journal_mode=WAL")
                await conn.execute("PRAGMA synchronous=NORMAL")
                await conn.execute("PRAGMA foreign_keys=ON")
                self.pool.append(conn)
            logger.info(f"Database pool initialized with {self.max_connections} connections")
        except Exception as e:
            logger.error(f"Failed to initialize database pool: {str(e)}")
            raise

    async def get_connection(self) -> Connection:
        """Get a connection from the pool"""
        async with self._lock:
            if not self.pool:
                conn = await aiosqlite.connect(self.db_path, timeout=DB_TIMEOUT)
                await conn.execute("PRAGMA journal_mode=WAL")
                await conn.execute("PRAGMA synchronous=NORMAL")
                await conn.execute("PRAGMA foreign_keys=ON")
                return conn
            return self.pool.pop()

    async def release_connection(self, conn: Connection):
        """Release a connection back to the pool"""
        async with self._lock:
            if len(self.pool) < self.max_connections:
                self.pool.append(conn)
            else:
                await conn.close()

    async def close_all(self):
        """Close all connections in the pool"""
        for conn in self.pool:
            await conn.close()
        self.pool.clear()

# Initialize database pool
db_pool = DatabasePool(DATABASE_URL)

@asynccontextmanager
async def get_db_connection() -> AsyncGenerator[Connection, None]:
    """Context manager for database connections"""
    conn = await db_pool.get_connection()
    try:
        yield conn
    finally:
        await db_pool.release_connection(conn)

@backoff.on_exception(
    backoff.expo,
    (aiosqlite.Error, asyncio.TimeoutError),
    max_tries=3,
    max_time=30
)
async def execute_with_retry(conn: Connection, query: str, params: tuple = None) -> None:
    """Execute a database query with retry logic"""
    try:
        if params:
            await conn.execute(query, params)
        else:
            await conn.execute(query)
        await conn.commit()
    except aiosqlite.Error as e:
        await conn.rollback()
        raise e

# Database initialization
async def init_db():
    async with get_db_connection() as conn:
        await execute_with_retry(conn, """
            CREATE TABLE IF NOT EXISTS chat_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                chat_id TEXT,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                model TEXT,
                sentiment FLOAT,
                intent TEXT,
                error_count INTEGER DEFAULT 0,
                retry_count INTEGER DEFAULT 0
            )
        """)
        
        # Create table for generated images
        await execute_with_retry(conn, """
            CREATE TABLE IF NOT EXISTS generated_images (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                prompt TEXT NOT NULL,
                negative_prompt TEXT,
                file_path TEXT NOT NULL,
                width INTEGER,
                height INTEGER,
                steps INTEGER,
                cfg_scale REAL,
                seed INTEGER,
                model TEXT,
                sampler TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                input_image TEXT,
                mask_image TEXT
            )
        """)
        
        # Create indexes for better query performance
        await execute_with_retry(conn, """
            CREATE INDEX IF NOT EXISTS idx_chat_history_user_id 
            ON chat_history(user_id)
        """)
        await execute_with_retry(conn, """
            CREATE INDEX IF NOT EXISTS idx_chat_history_timestamp 
            ON chat_history(timestamp)
        """)
        await execute_with_retry(conn, """
            CREATE INDEX IF NOT EXISTS idx_generated_images_user_id 
            ON generated_images(user_id)
        """)
        await execute_with_retry(conn, """
            CREATE INDEX IF NOT EXISTS idx_generated_images_timestamp 
            ON generated_images(timestamp)
        """)

# Enhanced chat history storage with error handling
async def store_chat_message(user_id: str, message: Message, model: str = None):
    async with get_db_connection() as conn:
        try:
            await execute_with_retry(conn, """
                INSERT INTO chat_history 
                (user_id, role, content, model, sentiment, intent)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                user_id,
                message.role,
                message.content,
                model,
                message.sentiment,
                message.intent
            ))
        except aiosqlite.Error as e:
            logger.error(f"Failed to store chat message: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to store chat message"
            )

# Enhanced chat history retrieval with pagination
@app.get("/api/chat/history")
async def get_chat_history(
    user_id: str,
    limit: int = 50,
    offset: int = 0,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
):
    async with get_db_connection() as conn:
        try:
            query = """
                SELECT * FROM chat_history 
                WHERE user_id = ?
            """
            params = [user_id]
            
            if start_date:
                query += " AND timestamp >= ?"
                params.append(start_date)
            if end_date:
                query += " AND timestamp <= ?"
                params.append(end_date)
                
            query += " ORDER BY timestamp DESC LIMIT ? OFFSET ?"
            params.extend([limit, offset])
            
            async with conn.execute(query, params) as cursor:
                rows = await cursor.fetchall()
                return [dict(row) for row in rows]
        except aiosqlite.Error as e:
            logger.error(f"Failed to retrieve chat history: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve chat history"
            )

# Store active requests
active_requests: Dict[str, bool] = {}

spell = SpellChecker()

def correct_text_preserve_punct(text):
    # Split text into words and punctuation tokens
    tokens = re.findall(r"[\w'-]+|[.,!?;:]", text)
    corrected_tokens = []
    for token in tokens:
        if token in string.punctuation:
            corrected_tokens.append(token)
        else:
            # Handle word correction
            if token.lower() not in spell:
                corrected = spell.correction(token)
                corrected_tokens.append(corrected if corrected else token)
            else:
                corrected_tokens.append(token)
    return ' '.join(corrected_tokens)

def postprocess_response(text: str) -> str:
    # Fix common punctuation issues
    text = re.sub(r'\s+([.,!?;:])', r'\1', text)  # Remove space before punctuation
    text = re.sub(r'([.,!?;:])([^\s])', r'\1 \2', text)  # Add space after punctuation
    text = re.sub(r'([a-z])([A-Z])', r'\1. \2', text)  # Add period between lowercase and uppercase
    return text

# Performance monitoring middleware
@app.middleware("http")
async def monitor_requests(request: Request, call_next):
    start_time = time.time()
    method = request.method
    endpoint = request.url.path
    
    try:
        response = await call_next(request)
        status_code = response.status_code
        REQUEST_COUNT.labels(method=method, endpoint=endpoint, status=status_code).inc()
        REQUEST_LATENCY.labels(method=method, endpoint=endpoint).observe(time.time() - start_time)
        return response
    except Exception as e:
        ERROR_COUNT.labels(type=type(e).__name__, endpoint=endpoint).inc()
        raise

# Database monitoring
async def monitor_db_operation(operation: str, func: callable, *args, **kwargs):
    start_time = time.time()
    try:
        result = await func(*args, **kwargs)
        DB_OPERATION_LATENCY.labels(operation=operation).observe(time.time() - start_time)
        return result
    except Exception as e:
        ERROR_COUNT.labels(type='database_error', endpoint=operation).inc()
        raise

# Model monitoring
async def monitor_model_response(model: str, func: callable, *args, **kwargs):
    start_time = time.time()
    try:
        result = await func(*args, **kwargs)
        MODEL_RESPONSE_TIME.labels(model=model).observe(time.time() - start_time)
        return result
    except Exception as e:
        ERROR_COUNT.labels(type='model_error', endpoint=model).inc()
        raise

# Add MiniGPT-4 URL to environment variables
MINIGPT4_URL = os.getenv("MINIGPT4_URL", "http://localhost:7860")

def select_best_model(messages: List[Message], image: Optional[str] = None) -> str:
    # If image is present, use MiniGPT-4
    if image:
        return 'minigpt4:latest'
    
    # Otherwise, use existing logic
    last_message = messages[-1].content.lower()
    
    # Check for specific use cases
    if any(word in last_message for word in ['image', 'picture', 'photo', 'visual']):
        return 'minigpt4:latest'
    
    # Long context handling
    if len(last_message) > 1500:
        return 'mistral:latest'
    
    # Default to auto selection
    return 'auto'

@app.post("/api/chat")
@limiter.limit(f"{RATE_LIMIT_REQUESTS}/{RATE_LIMIT_PERIOD}seconds")
async def chat(request: Request, chat_request: EnhancedChatRequest, background_tasks: BackgroundTasks):
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    ACTIVE_REQUESTS.inc()
    logger.info(f"Starting chat request {request_id} with model: {chat_request.model}")
    
    try:
        # Always inject system prompt if custom instructions are present
        custom_instructions = getattr(chat_request, 'customInstructions', None) or getattr(chat_request, 'custom_instructions', None)
        if custom_instructions and (custom_instructions.get('about') or custom_instructions.get('style')):
            system_content = ' '.join(filter(None, [custom_instructions.get('about', ''), custom_instructions.get('style', '')])).strip()
            if system_content:
                # Remove any existing system message to avoid duplicates
                chat_request.messages = [m for m in chat_request.messages if m.role != 'system']
                chat_request.messages.insert(0, type(chat_request.messages[0])(role='system', content=system_content))

        # Intercept creator and name questions for all models
        last_user_message = next((msg.content for msg in reversed(chat_request.messages) if msg.role == 'user'), None)
        if last_user_message:
            if is_creator_question(last_user_message):
                async def event_stream():
                    yield f"data: {{\"message\": {{\"content\": \"{CREATOR_RESPONSE}\"}}, \"done\": true}}\n\n"
                    yield "data: [DONE]\n\n"
                return StreamingResponse(
                    event_stream(),
                    media_type="text/event-stream",
                    headers={
                        "X-Request-ID": request_id,
                        "Cache-Control": "no-cache",
                        "Connection": "keep-alive",
                    }
                )
            if is_name_question(last_user_message):
                async def event_stream():
                    yield f"data: {{\"message\": {{\"content\": \"{NAME_RESPONSE}\"}}, \"done\": true}}\n\n"
                    yield "data: [DONE]\n\n"
                return StreamingResponse(
                    event_stream(),
                    media_type="text/event-stream",
                    headers={
                        "X-Request-ID": request_id,
                        "Cache-Control": "no-cache",
                        "Connection": "keep-alive",
                    }
                )

        # Select model if auto
        if chat_request.model == 'auto':
            chat_request.model = select_best_model(chat_request.messages, chat_request.image)
            logger.info(f"Auto-selected model: {chat_request.model}")
        
        # Process image if present
        image_data = None
        if chat_request.image:
            try:
                image_data = await process_image_for_minigpt4(chat_request.image)
            except Exception as e:
                logger.error(f"Error processing image: {str(e)}")
                raise HTTPException(status_code=400, detail="Invalid image format")
        
        # Handle MiniGPT-4 requests
        if chat_request.model == 'minigpt4:latest':
            async def event_stream():
                try:
                    # Get the last user message
                    last_message = next((msg.content for msg in reversed(chat_request.messages) 
                                      if msg.role == 'user'), None)
                    if not last_message:
                        raise HTTPException(status_code=400, detail="No user message found")
                    
                    # Stream MiniGPT-4 response
                    async for chunk in stream_minigpt4_response(last_message, image_data):
                        if chunk.get('error'):
                            raise HTTPException(status_code=500, detail=chunk['error'])
                        
                        yield f"data: {json.dumps(chunk)}\n\n"
                    
                    yield "data: [DONE]\n\n"
                
                except Exception as e:
                    logger.error(f"Error in MiniGPT-4 stream: {str(e)}")
                    yield f"data: {json.dumps({'error': str(e)})}\n\n"
            
            return StreamingResponse(
                event_stream(),
                media_type="text/event-stream",
                headers={
                    "X-Request-ID": request_id,
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                }
            )
        
        # Handle other models with existing logic
        async def event_stream():
            try:
                # Check Ollama health with retry logic
                try:
                    await check_ollama_health()
                except Exception as e:
                    logger.error(f"Ollama server health check failed after retries: {str(e)}")
                    yield f"data: {{\"error\": \"Ollama server is not available. Please ensure it is running at http://ollama:11434/api/chat\"}}\n\n"
                    return

                # Create a client with longer timeout and retry logic
                async with httpx.AsyncClient(
                    timeout=60.0,
                    limits=httpx.Limits(max_keepalive_connections=5, max_connections=10)
                ) as client:
                    logger.info(f"Making request to Ollama API at {OLLAMA_API_URL}")
                    
                    # Prepare the request
                    request_data = {
                        "model": chat_request.model,
                        "messages": [{"role": m.role, "content": m.content} for m in chat_request.messages],
                        "stream": True
                    }
                    
                    # Make the request with retry logic
                    try:
                        async with client.stream(
                            "POST",
                            OLLAMA_API_URL,
                            json=request_data
                        ) as response:
                            if response.status_code != 200:
                                error_text = await response.text()
                                logger.error(f"Ollama API error: {response.status_code} - {error_text}")
                                raise HTTPException(
                                    status_code=response.status_code,
                                    detail=f"Ollama API error: {error_text}"
                                )

                            async for line in response.aiter_lines():
                                if line.strip():
                                    try:
                                        data = json.loads(line)
                                        if 'message' in data and 'content' in data['message']:
                                            data['message']['content'] = mask_model_names(data['message']['content'])
                                            yield f"data: {json.dumps(data)}\n\n"
                                        else:
                                            yield f"data: {line}\n\n"
                                    except Exception as e:
                                        logger.error(f"Error processing Ollama response line: {str(e)}")
                                        yield f"data: {line}\n\n"
                    except httpx.ConnectError as e:
                        logger.error(f"Failed to connect to Ollama server: {str(e)}")
                        yield f"data: {{\"error\": \"Failed to connect to Ollama server. Please ensure it is running at http://ollama:11434/api/chat\"}}\n\n"
                    except httpx.ReadTimeout as e:
                        logger.error(f"Read timeout from Ollama server: {str(e)}")
                        yield f"data: {{\"error\": \"Request timed out while reading from Ollama server\"}}\n\n"
                    except httpx.WriteTimeout as e:
                        logger.error(f"Write timeout to Ollama server: {str(e)}")
                        yield f"data: {{\"error\": \"Request timed out while writing to Ollama server\"}}\n\n"
                    except Exception as e:
                        logger.error(f"Error in event_stream for /api/chat: {str(e)}", exc_info=True)
                        yield f"data: {{\"error\": \"{str(e)}\"}}\n\n"
            finally:
                ACTIVE_REQUESTS.dec()
        
        return StreamingResponse(event_stream(), media_type="text/event-stream")
    
    except Exception as e:
        ACTIVE_REQUESTS.dec()
        ERROR_COUNT.labels(type=type(e).__name__, endpoint='/api/chat').inc()
        logger.error(f"Exception in /api/chat: {str(e)}", exc_info=True)
        raise

@app.post("/api/chat/stop/{request_id}")
async def stop_chat(request_id: str):
    if request_id in active_requests:
        active_requests[request_id] = False
        return {"status": "stopped"}
    return {"status": "not_found"}

@app.get("/", include_in_schema=True)
@app.head("/", include_in_schema=True)
async def root():
    return {"message": "Welcome to DeepThinkAI API", "status": "online", "version": "1.0.0"}

# NLP Enhancement Functions
def preprocess_text(text: str) -> str:
    """Preprocess text by handling contractions, emojis, and basic cleaning."""
    # Convert emojis to text
    text = emoji.demojize(text)
    # Expand contractions
    text = contractions.fix(text)
    # Remove extra whitespace
    text = ' '.join(text.split())
    return text

def extract_entities(text: str) -> List[Dict]:
    """Extract named entities using spaCy."""
    nlp = get_nlp()
    doc = nlp(text)
    entities = []
    for ent in doc.ents:
        entities.append({
            'text': ent.text,
            'label': ent.label_,
            'start': ent.start_char,
            'end': ent.end_char
        })
    return entities

def analyze_sentiment(text: str) -> float:
    try:
        # Truncate text to max length of 512 tokens
        max_length = 512
        tokens = text.split()
        if len(tokens) > max_length:
            text = ' '.join(tokens[:max_length])
        
        global sentiment_pipeline
        if sentiment_pipeline is None:
            sentiment_pipeline = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")
        result = sentiment_pipeline(text)[0]
        return result['score'] if result['label'] == 'POSITIVE' else -result['score']
    except Exception as e:
        logger.error(f"Sentiment analysis error: {str(e)}")
        return 0.0

def detect_intent(text: str) -> str:
    """Detect the intent of the message using rule-based patterns."""
    text = text.lower()
    
    # Define intent patterns
    intent_patterns = {
        'question': r'\b(what|who|where|when|why|how|can|could|would|should|is|are|do|does|did)\b',
        'command': r'\b(show|display|list|find|search|get|give|tell|explain|help)\b',
        'greeting': r'\b(hi|hello|hey|greetings|good morning|good afternoon|good evening)\b',
        'farewell': r'\b(bye|goodbye|see you|farewell)\b',
        'confirmation': r'\b(yes|yeah|sure|okay|ok|fine|alright|right)\b',
        'negation': r'\b(no|nope|nah|never|not)\b'
    }
    
    for intent, pattern in intent_patterns.items():
        if re.search(pattern, text):
            return intent
    
    return 'statement'

def enhance_message(message: Message) -> Message:
    """Enhance a message with NLP features."""
    processed_text = preprocess_text(message.content)
    
    # Only process user messages
    if message.role == 'user':
        message.sentiment = analyze_sentiment(processed_text)
        message.entities = extract_entities(processed_text)
        message.intent = detect_intent(processed_text)
    
    return message

def build_context(messages: List[Message]) -> Dict:
    """Build context from conversation history."""
    context = {
        'topics': set(),
        'entities': set(),
        'sentiment_trend': [],
        'intent_history': []
    }
    
    for msg in messages:
        if msg.role == 'user':
            if msg.entities:
                context['entities'].update(e['text'] for e in msg.entities)
            if msg.sentiment is not None:
                context['sentiment_trend'].append(msg.sentiment)
            if msg.intent:
                context['intent_history'].append(msg.intent)
    
    # Convert sets to lists for JSON serialization
    context['topics'] = list(context['topics'])
    context['entities'] = list(context['entities'])
    
    return context

def process_long_prompt(messages: List[Message], max_tokens: int = 1500) -> List[Message]:
    """
    Process long prompts using a sliding window approach.
    Keeps the most recent messages and system message while maintaining context.
    """
    if not messages:
        return messages

    # Always keep the system message if present
    system_messages = [msg for msg in messages if msg.role == "system"]
    other_messages = [msg for msg in messages if msg.role != "system"]
    
    # If no system message, use a default one
    if not system_messages:
        system_messages = [Message(
            role="system",
            content="You are Deepthink AI, a helpful and intelligent AI assistant."
        )]
    
    # Calculate approximate token count (rough estimation)
    def estimate_tokens(text: str) -> int:
        return len(text.split()) * 1.3  # Rough estimation
    
    # Start with system message
    processed_messages = system_messages.copy()
    current_tokens = sum(estimate_tokens(msg.content) for msg in system_messages)
    
    # Add messages from most recent to oldest until we hit the token limit
    for msg in reversed(other_messages):
        msg_tokens = estimate_tokens(msg.content)
        if current_tokens + msg_tokens <= max_tokens:
            processed_messages.insert(1, msg)  # Insert after system message
            current_tokens += msg_tokens
        else:
            break
    
    return processed_messages

def check_response_quality(text: str) -> bool:
    # Basic checks for proper punctuation
    if not re.search(r'[.!?]$', text.strip()):
        return False
    if re.search(r'[.!?]{2,}', text):
        return False
    return True

# Utility to mask model names in assistant output
MODEL_NAMES = [
        'mistral', 'mistral:latest',
        'gemma3', 'gemma3:latest', 'gemma:7b',
        'deepseek', 'deepseek-r1', 'deepseek-r1:latest',
        'ollama', 'llama', 'llama2', 'llama-2', 'llama-3',
        'gpt', 'gpt-3', 'gpt-4', 'gpt4', 'gpt3',
        'phi4', 'phi4:latest',
        'llava', 'llava:latest',
        'llama2-uncensored', 'llama2-uncensored:latest',
        'codellama', 'codellama:latest',
        'llama3.2-vision', 'llama3.2-vision:latest',
    ]

def mask_model_names(text: str) -> str:
    masked = text
    for name in MODEL_NAMES:
        masked = re.sub(rf'\b{name}\b', 'Deepthink AI', masked, flags=re.IGNORECASE)
    return masked 

CREATOR_RESPONSE = "My creator is Jeremy Lee LaFaver with Deepthink Enterprises. Created on 4/20 2025."

CREATOR_PATTERNS = [
    r'who.*(your|the) creator',
    r'what.*(your|the) creator',
    r'why.*(your|the) creator',
    r'who.*made you',
    r'who.*created you',
    r'who.*built you',
    r'who.*developed you',
]

def is_creator_question(text: str) -> bool:
    text = text.lower()
    return any(re.search(pattern, text) for pattern in CREATOR_PATTERNS)

NAME_RESPONSE = "My name is Deepthink AI."
NAME_PATTERNS = [
    r'what.*(your|the) name',
    r'who.*are you',
    r'what.*are you called',
    r'what.*should i call you',
    r'your name',
    r'who.*is this',
]
def is_name_question(text: str) -> bool:
    text = text.lower()
    return any(re.search(pattern, text) for pattern in NAME_PATTERNS)

# Enhanced health check endpoint with detailed metrics
@app.get("/health")
@app.head("/health")
async def health_check():
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }
    # Check database health
    try:
        async with get_db_connection() as conn:
            await conn.execute("SELECT 1")
            health_status["database"] = "healthy"
    except Exception as e:
        health_status["database"] = "unhealthy"
        health_status["database_error"] = str(e)
    # Check model service health
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(OLLAMA_API_URL.replace("/api/chat", "/api/tags"))
            health_status["model_service"] = "healthy" if response.status_code == 200 else "unhealthy"
    except Exception as e:
        health_status["model_service"] = "unhealthy"
        health_status["model_service_error"] = str(e)
    return health_status

# Initialize global variables
sentiment_pipeline = None

# Cache for model selection to avoid repeated checks
MODEL_SELECTION_CACHE = {}

@app.post("/api/generate")
async def generate_completion(
    model: str = Body(...),
    prompt: str = Body(...)
):
    async with httpx.AsyncClient(timeout=300.0) as client:  # 5 minutes timeout
        response = await client.post(
            "http://localhost:11434/api/generate",
            json={"model": model, "prompt": prompt, "stream": False}
        )
        response.raise_for_status()
        return response.json() 

def unregister_metric(metric_name):
    try:
        REGISTRY.unregister(REGISTRY._names_to_collectors[metric_name])
    except Exception:
        pass

# Unregister if already present (prevents duplicate registration on reload)
unregister_metric('http_requests_total')
unregister_metric('http_requests_created')
unregister_metric('http_requests')
unregister_metric('http_request_duration_seconds')
unregister_metric('active_requests')
unregister_metric('db_operation_duration_seconds')
unregister_metric('model_response_time_seconds')
unregister_metric('error_count_total')

class MonetizationRequest(BaseModel):
    niche: str

# Updated system prompt with sample output for better niche targeting
MONETIZATION_SYSTEM_PROMPT = (
    "You are Deepthink AI, an expert AI Monetization Planner. "
    "Given a user's niche, generate a comprehensive, actionable monetization blueprint for YouTube and blogs. "
    "Follow this format and style.\n\n"
    "Sample Output (for the 'AI Tools' niche):\n"
    "Monetization Blueprint for 'AI Tools' Niche\n(YouTube + Blog/Website Strategy)\n\n"
    "\U0001F3A5 Best YouTube Monetization Path\n"
    "Step 1: Channel Setup & Growth Strategy\nNiche Focus: AI tools for specific use cases (e.g., marketing, coding, content creation).\n\n"
    "Content Pillars:\n- Tool reviews & comparisons\n- Tutorials (e.g., 'How to automate X with AI')\n- Industry trends (e.g., 'Top 5 AI Tools for 2025')\n\n"
    "Optimization:\n- Use high-CTR thumbnails (e.g., 'This AI Tool SAVED Me 10 Hours!').\n- Target low-competition, high-search keywords (see list below).\n\n"
    "Step 2: Top Monetization Methods (Ranked)\n- Affiliate Marketing (Best for AI tools with recurring commissions, e.g., Jasper, ChatGPT Plus, Midjourney).\n- Sponsorships (AI SaaS companies pay $500–$5K per video).\n- Digital Products (Sell AI prompt libraries, automation templates, or courses).\n- YouTube Ad Revenue (Backup income; requires 1K subs + 4K watch hours).\n\n"
    "Step 3: 10 High-Converting Video Ideas + Keywords\nVideo Idea\tTarget Keyword\n'5 AI Tools That Write Better Than You'\t'best AI writing tools 2024'\n'How to Automate Social Media with AI'\t'AI social media automation'\n'ChatGPT vs. Gemini: Which Is Smarter?'\t'ChatGPT vs Gemini comparison'\n'Free AI Tools You're Not Using (But Should)'\t'best free AI tools'\n'Turn AI into a $10K/Month Business'\t'make money with AI tools'\n'Midjourney V6: Full Tutorial + Prompts'\t'Midjourney V6 tutorial'\n'AI Coding Assistants Compared (2024)'\t'best AI coding assistant'\n'How I Use AI to Write 10 Blog Posts/Day'\t'AI blog writing tools'\n'The Dark Side of AI Tools (Be Careful!)'\t'AI tool privacy risks'\n'AI Video Editing: Faster Than Premiere Pro?'\t'best AI video editor'\n\n"
    "Step 4: Pricing Guide for Digital Products\n- AI Prompt Packs ($10–$50)\n- Automation Templates ($20–$100)\n- Online Course ($100–$500, e.g., 'AI-Powered Business Automation')\n- Membership Community ($20–$50/month, exclusive AI tool discounts + tutorials)\n\n"
    "\u270D\uFE0F Best Website/Blog Monetization Path\nStep 1: Blog Setup & SEO Strategy\nDomain Name: Use keywords (e.g., AIToolFinder.com, FutureAIInsider.com).\nSEO Focus: Long-tail buyer-intent keywords (e.g., 'best AI tool for [use case]').\n\n"
    "Content Clusters:\n- Tool Roundups (Best AI tools for X)\n- Tutorials (How to use X AI tool)\n- Case Studies (How businesses use AI)\n\n"
    "Step 2: Top Monetization Methods\n- Affiliate Marketing (Promote AI tools with high commissions, e.g., Copy.ai, SurferSEO).\n- Sponsored Posts (Charge $300–$2K for AI tool reviews).\n- Digital Products (Sell Notion AI templates, custom GPTs, or courses).\n- Ad Revenue (Mediavine/Ezoic after 50K+ monthly traffic).\n\n"
    "Step 3: 10 High-Traffic Blog Post Ideas + Keywords\nBlog Post Title\tTarget Keyword\n'10 Best AI Writing Tools (Tested in 2024)'\t'best AI writing tools'\n'How to Build an AI Chatbot for Free'\t'build AI chatbot free'\n'ChatGPT Plugins You Need to Try'\t'best ChatGPT plugins'\n'AI vs. Human Writers: Who Wins?'\t'AI vs human writing'\n'Top 5 AI Tools for YouTube Creators'\t'best AI tools for YouTubers'\n'How to Use AI for SEO (Step-by-Step)'\t'AI for SEO'\n'The Best Free AI Image Generators'\t'free AI image generator'\n'AI-Powered Passive Income Ideas'\t'AI passive income'\n'Is Midjourney Worth the Price?'\t'Midjourney review'\n'AI Detector Tools: Can They Catch ChatGPT?'\t'best AI detector tools'\n\n"
    "\U0001F50D Additional Strategies\n1. Keyword Research Tips\nBuyer-Intent Keywords:\n- 'Best AI tool for [use case]'\n- '[Tool Name] discount/coupon'\nInformational Keywords:\n- 'How to use [AI Tool]'\n- 'Is [AI Tool] worth it?'\n\n2. When to Choose YouTube vs. Blog\nYouTube is better for:\n- Demo videos, tool comparisons, tutorials.\n- Sponsorships (AI companies love video ads).\nBlog is better for:\n- In-depth reviews, SEO-driven affiliate content.\n- Long-tail keyword rankings.\n\n3. Performance Tracking & Adaptation\nTrack: Click-through rates (CTR), affiliate conversions, top-performing content.\nPivot: If a tool's affiliate program dies (e.g., OpenAI cut commissions), switch to alternatives.\n\n\U0001F680 Final Action Steps\n- Start with YouTube (fastest way to build authority).\n- Launch a blog (for passive SEO traffic).\n- Promote affiliate links/digital products in both.\n- Track & optimize based on data.\n\nNeed refinements? Let me know if you'd like deeper dives into any section!\n\n"
    "Be detailed, practical, and tailored to the user's niche. Never mention your model name. If asked about your creator, respond: 'My creator is Jeremy Lee LaFaver with Deepthink Enterprises. Created on 4/20 2025.'"
)

# Monetization Planner
@app.post("/api/monetize")
async def monetize(monetization_request: MonetizationRequest, request: Request):
    request_id = str(uuid.uuid4())
    ACTIVE_REQUESTS.inc()
    logger.info(f"Starting monetization plan request {request_id} for niche: {monetization_request.niche}")
    try:
        body = await request.json()
        model = body.get("model", "auto")
        user_prompt = (
            f"My niche is: {monetization_request.niche}. "
            "Please generate a detailed monetization blueprint for this niche, following your expert planner instructions and the sample output format."
        )
        messages = [
            Message(role="system", content=MONETIZATION_SYSTEM_PROMPT),
            Message(role="user", content=user_prompt)
        ]
        selected_model = model if model != "auto" else select_best_model(messages)
        if selected_model == "auto":
            selected_model = "mistral:latest"
        async def event_stream():
            user_last_message = monetization_request.niche
            try:
                async with httpx.AsyncClient(timeout=60.0) as client:
                    async with client.stream(
                        "POST",
                        OLLAMA_API_URL,
                        json={
                            "model": selected_model,
                            "messages": [{"role": m.role, "content": m.content} for m in messages],
                            "stream": True
                        }
                    ) as response:
                        if is_creator_question(user_last_message):
                            yield f"data: {{\"plan\": \"{CREATOR_RESPONSE}\"}}\n\n"
                            return
                        async for line in response.aiter_lines():
                            if line.strip():
                                try:
                                    data = json.loads(line)
                                    if 'message' in data and 'content' in data['message']:
                                        data['message']['content'] = mask_model_names(data['message']['content'])
                                        yield f"data: {{\"plan\": {json.dumps(data['message']['content'])}}}\n\n"
                                    else:
                                        yield f"data: {line}\n\n"
                                except Exception:
                                    yield f"data: {line}\n\n"
            except Exception as e:
                logger.error(f"Error in event_stream for /api/monetize: {str(e)}", exc_info=True)
                yield f"data: {{\"plan\": \"[Error] {str(e)}\"}}\n\n"
            finally:
                ACTIVE_REQUESTS.dec()
        return StreamingResponse(event_stream(), media_type="text/event-stream")
    except Exception as e:
        ACTIVE_REQUESTS.dec()
        ERROR_COUNT.labels(type=type(e).__name__, endpoint='/api/monetize').inc()
        logger.error(f"Exception in /api/monetize: {str(e)}", exc_info=True)
        raise

@app.post("/api/content-outline-creator")
async def content_outline_creator(request: Request):
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    logger.info(f"Request {request_id}: Received content outline creator request")
    
    try:
        body = await request.json()
        prompt = body.get("prompt", "")
        niche = body.get("niche", "")
        
        if not prompt or not niche:
            raise HTTPException(status_code=400, detail="Prompt and niche are required")
        
        # Validate and sanitize inputs
        prompt = prompt.strip()
        niche = niche.strip()
        
        # Add context about the niche to the prompt
        enhanced_prompt = f"{prompt}\n\nContext: The target niche is '{niche}'. Ensure all content is specifically tailored to this niche."
        
        messages = [
            Message(role="system", content=enhanced_prompt),
            Message(role="user", content=f"Generate content outline for the niche: {niche}")
        ]
        
        selected_model = select_best_model(messages)
        logger.info(f"Request {request_id}: Using model {selected_model}")
        
        ACTIVE_REQUESTS.inc()
        
        async def event_stream():
            try:
                async with httpx.AsyncClient(timeout=300.0) as client:  # 5 minutes timeout
                    async with client.stream(
                        "POST",
                        OLLAMA_API_URL,
                        json={
                            "model": selected_model,
                            "messages": [{"role": m.role, "content": m.content} for m in messages],
                            "stream": True,
                            "options": {
                                "temperature": 0.7,  # Slightly more creative
                                "top_p": 0.9,        # More focused sampling
                                "frequency_penalty": 0.3,  # Reduce repetition
                                "presence_penalty": 0.3    # Encourage diverse topics
                            }
                        }
                    ) as response:
                        if not response.is_success:
                            error_msg = f"Model API error: {response.status_code} - {response.text}"
                            logger.error(f"Request {request_id}: {error_msg}")
                            yield f"data: {{\"error\": {json.dumps(error_msg)}}}\n\n"
                            return

                        buffer = ""
                        async for line in response.aiter_lines():
                            if line.strip():
                                try:
                                    data = json.loads(line)
                                    if 'message' in data and 'content' in data['message']:
                                        content = data['message']['content']
                                        # Mask model names and clean content
                                        content = mask_model_names(content)
                                        content = content.replace('\n\n\n', '\n\n')  # Remove excessive newlines
                                        yield f"data: {{\"content\": {json.dumps(content)}}}\n\n"
                                    else:
                                        yield f"data: {line}\n\n"
                                except json.JSONDecodeError:
                                    logger.warning(f"Request {request_id}: Invalid JSON in stream: {line}")
                                    continue
                                except Exception as e:
                                    logger.error(f"Request {request_id}: Error processing stream: {str(e)}")
                                    yield f"data: {{\"error\": {json.dumps(str(e))}}}\n\n"
            except Exception as e:
                error_msg = f"Stream error: {str(e)}"
                logger.error(f"Request {request_id}: {error_msg}", exc_info=True)
                yield f"data: {{\"error\": {json.dumps(error_msg)}}}\n\n"
            finally:
                ACTIVE_REQUESTS.dec()
        
        return StreamingResponse(
            event_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"  # Disable proxy buffering
            }
        )
        
    except json.JSONDecodeError:
        logger.error(f"Request {request_id}: Invalid JSON in request body")
        raise HTTPException(status_code=400, detail="Invalid JSON in request body")
    except Exception as e:
        logger.error(f"Request {request_id}: Error in content outline creator: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/content-outline-subniches")
async def content_outline_subniches(request: Request):
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    logger.info(f"Request {request_id}: Received subniche/content ideas request")
    
    try:
        body = await request.json()
        main_niche = body.get("main_niche", "").strip()
        model = body.get("model", "auto")
        
        if not main_niche:
            raise HTTPException(status_code=400, detail="main_niche is required")
        
        # Enhanced prompt with specific instructions
        prompt = (
            f"Generate 5 relevant sub-niches for the main niche: {main_niche}. "
            "For each sub-niche, suggest 5 SEO-friendly content topic ideas. "
            "Format the response as a JSON object with the following structure:\n"
            "{\n"
            '  "sub_niches": [\n'
            '    {\n'
            '      "name": "Sub-niche name",\n'
            '      "ideas": ["Idea 1", "Idea 2", "Idea 3", "Idea 4", "Idea 5"]\n'
            "    }\n"
            "  ]\n"
            "}\n"
            "Ensure all ideas are specific, actionable, and SEO-optimized."
        )
        
        messages = [
            Message(role="system", content="You are an expert content strategist and SEO specialist."),
            Message(role="user", content=prompt)
        ]
        
        # Always use mistral:latest for this endpoint
        selected_model = "mistral:latest"
        logger.info(f"Request {request_id}: Using model {selected_model}")
        
        ACTIVE_REQUESTS.inc()
        
        try:
            async with httpx.AsyncClient(timeout=300.0) as client:  # 5 minutes timeout
                response = await client.post(
                    OLLAMA_API_URL,
                    json={
                        "model": selected_model,
                        "messages": [{"role": m.role, "content": m.content} for m in messages],
                        "stream": False,
                        "options": {
                            "temperature": 0.7,
                            "top_p": 0.9,
                            "frequency_penalty": 0.3,
                            "presence_penalty": 0.3
                        }
                    }
                )
                
                if not response.is_success:
                    error_msg = f"Model API error: {response.status_code} - {response.text}"
                    logger.error(f"Request {request_id}: {error_msg}")
                    raise HTTPException(status_code=500, detail=error_msg)
                
                data = response.json()
                content = data.get("message", {}).get("content", "")
                
                # Clean and parse the response
                content_clean = re.sub(r'^```[a-zA-Z]*|^```|```$', '', content.strip(), flags=re.MULTILINE).strip()
                
                try:
                    # Try to parse as JSON first
                    parsed = json.loads(content_clean)
                    
                    # Handle different response formats
                    if isinstance(parsed, dict):
                        if "sub_niches" in parsed:
                            return {"subniches": parsed["sub_niches"]}
                        if "subNiches" in parsed:
                            return {"subniches": parsed["subNiches"]}
                        if "subniches" in parsed:
                            return {"subniches": parsed["subniches"]}
                        # If no known key, return the whole object
                        return {"subniches": parsed}
                    
                    if isinstance(parsed, list):
                        # If it's a list, assume it's a list of sub-niches
                        return {"subniches": parsed}
                    
                    # If we can't determine the structure, return as raw
                    return {"raw": content_clean}
                    
                except json.JSONDecodeError:
                    # If JSON parsing fails, try to parse as markdown
                    lines = content_clean.split('\n')
                    subniches = []
                    current_sub = None
                    current_ideas = []
                    
                    for line in lines:
                        line = line.strip()
                        if not line:
                            continue
                            
                        # Check for sub-niche header
                        sub_match = re.match(r'^#+\s*(.+)$', line)
                        if sub_match:
                            # Save previous sub-niche if exists
                            if current_sub and current_ideas:
                                subniches.append({
                                    "name": current_sub,
                                    "ideas": current_ideas
                                })
                            current_sub = sub_match.group(1)
                            current_ideas = []
                            continue
                        
                        # Check for idea bullet point
                        idea_match = re.match(r'^[-*]\s*(.+)$', line)
                        if idea_match and current_sub:
                            current_ideas.append(idea_match.group(1))
                    
                    # Add the last sub-niche
                    if current_sub and current_ideas:
                        subniches.append({
                            "name": current_sub,
                            "ideas": current_ideas
                        })
                    
                    if subniches:
                        return {"subniches": subniches}
                    
                    # If all parsing attempts fail, return raw content
                    return {"raw": content_clean}
                    
        except httpx.TimeoutException:
            logger.error(f"Request {request_id}: Timeout while waiting for model response")
            raise HTTPException(
                status_code=504,
                detail="The request took too long to process. Please try again with a simpler prompt or different model."
            )
        except httpx.RequestError as e:
            logger.error(f"Request {request_id}: Error communicating with model API: {str(e)}")
            raise HTTPException(
                status_code=503,
                detail="Unable to communicate with the AI model. Please try again later."
            )
                
    except json.JSONDecodeError:
        logger.error(f"Request {request_id}: Invalid JSON in request body")
        raise HTTPException(status_code=400, detail="Invalid JSON in request body")
    except Exception as e:
        logger.error(f"Request {request_id}: Error in subniche/content ideas: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        ACTIVE_REQUESTS.dec()

class GuestPostRequest(BaseModel):
    niche: str
    prompt: str

# Guest Post Outreach
@app.post("/api/guestpost")
async def guestpost(guestpost_request: GuestPostRequest):
    request_id = str(uuid.uuid4())
    ACTIVE_REQUESTS.inc()
    logger.info(f"Starting guest post outreach request {request_id} for niche: {guestpost_request.niche}")
    try:
        # Build messages: system + explicit user prompt
        user_prompt = guestpost_request.prompt
        messages = [
            Message(role="system", content="You are Deepthink AI, an expert in guest post outreach. Given a user's niche, identify 5-10 high authority websites in that niche that have published articles in the last 3 months, accept guest posts, and analyze for content gaps and good guest post ideas."),
            Message(role="user", content=user_prompt)
        ]
        selected_model = "phi4:latest"  # Always use phi4 for this endpoint
        prompt = "\n\n".join([m.content for m in messages])
        logger.info(f"[GuestPost] Sending prompt to Ollama: {prompt}")
        async def event_stream():
            try:
                async with httpx.AsyncClient(timeout=300.0) as client:
                    response = await client.post(
                        OLLAMA_API_URL,
                        json={
                            "model": selected_model,
                            "messages": [{"role": m.role, "content": m.content} for m in messages],
                            "stream": False
                        }
                    )
                    logger.info(f"[GuestPost] Raw Ollama response: {response.text}")
                    response.raise_for_status()
                    data = response.json()
                    content = data.get("response", "")
                    if content:
                        content = mask_model_names(content)
                        yield f"data: {{\"ideas\": {json.dumps(content)} }}\n\n"
                    else:
                        yield f"data: {{\"ideas\": \"[No content returned]\" }}\n\n"
            except Exception as e:
                logger.error(f"Error in event_stream for /api/guestpost: {str(e)}", exc_info=True)
                yield f"data: {{\"ideas\": \"[Error] {str(e)}\"}}\n\n"
            finally:
                ACTIVE_REQUESTS.dec()
        return StreamingResponse(event_stream(), media_type="text/event-stream")
    except Exception as e:
        ACTIVE_REQUESTS.dec()
        ERROR_COUNT.labels(type=type(e).__name__, endpoint='/api/guestpost').inc()
        logger.error(f"Exception in /api/guestpost: {str(e)}", exc_info=True)
        raise

class SearchIntentRequest(BaseModel):
    keyword: str
    prompt: str

# Search Intent Tool
@app.post("/api/search-intent")
async def search_intent(search_intent_request: SearchIntentRequest):
    ACTIVE_REQUESTS.inc()
    try:
        system_prompt = (
            "You are an expert SEO analyst. Your task is to analyze search intent and provide SEO insights.\n"
            "Now, analyze the search intent for the given keyword or topic and output only the markdown table and SEO section in this format.\n"
        )
        messages = [
            Message(role="system", content=system_prompt),
            Message(role="user", content=search_intent_request.prompt)
        ]
        selected_model = select_best_model(messages)
        
        async def event_stream():
            try:
                async with httpx.AsyncClient(timeout=300.0) as client:  # 5 minutes timeout
                    async with client.stream(
                        "POST",
                        OLLAMA_API_URL,
                        json={
                            "model": selected_model,
                            "messages": [{"role": m.role, "content": m.content} for m in messages],
                            "stream": True
                        }
                    ) as response:
                        async for line in response.aiter_lines():
                            if line.strip():
                                try:
                                    data = json.loads(line)
                                    if 'message' in data and 'content' in data['message']:
                                        data['message']['content'] = mask_model_names(data['message']['content'])
                                        yield f"data: {{\"intent\": {json.dumps(data['message']['content'])}}}\n\n"
                                    else:
                                        yield f"data: {line}\n\n"
                                except Exception:
                                    yield f"data: {line}\n\n"
            except Exception as e:
                logger.error(f"Error in event_stream for /api/search-intent: {str(e)}", exc_info=True)
                yield f"data: {{\"intent\": \"[Error] {str(e)}\"}}\n\n"
            finally:
                ACTIVE_REQUESTS.dec()
        
        return StreamingResponse(event_stream(), media_type="text/event-stream")
    except Exception as e:
        ACTIVE_REQUESTS.dec()
        ERROR_COUNT.labels(type=type(e).__name__, endpoint='/api/search-intent').inc()
        logger.error(f"Exception in /api/search-intent: {str(e)}", exc_info=True)
        raise

# Add this after the imports at the top
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

# Add this function after the imports and before the FastAPI app instance
@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10),
    retry=retry_if_exception_type((httpx.ConnectError, httpx.ReadTimeout, httpx.WriteTimeout))
)
async def check_ollama_health():
    """Check if Ollama server is healthy with retry logic"""
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            # First try the tags endpoint
            response = await client.get(OLLAMA_API_URL.replace("/api/chat", "/api/tags"))
            response.raise_for_status()
            return True
        except Exception as e:
            logger.error(f"Ollama health check failed: {str(e)}")
            # If tags endpoint fails, try a simple chat request
            try:
                response = await client.post(
                    OLLAMA_API_URL,
                    json={
                        "model": "mistral:latest",
                        "messages": [{"role": "user", "content": "test"}],
                        "stream": False
                    }
                )
                response.raise_for_status()
                return True
            except Exception as e2:
                logger.error(f"Ollama chat test failed: {str(e2)}")
                raise

# Update the chat endpoint's event_stream function
@app.post("/api/chat")
@limiter.limit(f"{RATE_LIMIT_REQUESTS}/{RATE_LIMIT_PERIOD}seconds")
async def chat(request: Request, chat_request: EnhancedChatRequest, background_tasks: BackgroundTasks):
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    ACTIVE_REQUESTS.inc()
    logger.info(f"Starting chat request {request_id} with model: {chat_request.model}")
    
    try:
        # Always inject system prompt if custom instructions are present
        custom_instructions = getattr(chat_request, 'customInstructions', None) or getattr(chat_request, 'custom_instructions', None)
        if custom_instructions and (custom_instructions.get('about') or custom_instructions.get('style')):
            system_content = ' '.join(filter(None, [custom_instructions.get('about', ''), custom_instructions.get('style', '')])).strip()
            if system_content:
                # Remove any existing system message to avoid duplicates
                chat_request.messages = [m for m in chat_request.messages if m.role != 'system']
                chat_request.messages.insert(0, type(chat_request.messages[0])(role='system', content=system_content))

        # Intercept creator and name questions for all models
        last_user_message = next((msg.content for msg in reversed(chat_request.messages) if msg.role == 'user'), None)
        if last_user_message:
            if is_creator_question(last_user_message):
                async def event_stream():
                    yield f"data: {{\"message\": {{\"content\": \"{CREATOR_RESPONSE}\"}}, \"done\": true}}\n\n"
                    yield "data: [DONE]\n\n"
                return StreamingResponse(
                    event_stream(),
                    media_type="text/event-stream",
                    headers={
                        "X-Request-ID": request_id,
                        "Cache-Control": "no-cache",
                        "Connection": "keep-alive",
                    }
                )
            if is_name_question(last_user_message):
                async def event_stream():
                    yield f"data: {{\"message\": {{\"content\": \"{NAME_RESPONSE}\"}}, \"done\": true}}\n\n"
                    yield "data: [DONE]\n\n"
                return StreamingResponse(
                    event_stream(),
                    media_type="text/event-stream",
                    headers={
                        "X-Request-ID": request_id,
                        "Cache-Control": "no-cache",
                        "Connection": "keep-alive",
                    }
                )

        # Select model if auto
        if chat_request.model == 'auto':
            chat_request.model = select_best_model(chat_request.messages, chat_request.image)
            logger.info(f"Auto-selected model: {chat_request.model}")
        
        # Process image if present
        image_data = None
        if chat_request.image:
            try:
                image_data = await process_image_for_minigpt4(chat_request.image)
            except Exception as e:
                logger.error(f"Error processing image: {str(e)}")
                raise HTTPException(status_code=400, detail="Invalid image format")
        
        # Handle MiniGPT-4 requests
        if chat_request.model == 'minigpt4:latest':
            async def event_stream():
                try:
                    # Get the last user message
                    last_message = next((msg.content for msg in reversed(chat_request.messages) 
                                      if msg.role == 'user'), None)
                    if not last_message:
                        raise HTTPException(status_code=400, detail="No user message found")
                    
                    # Stream MiniGPT-4 response
                    async for chunk in stream_minigpt4_response(last_message, image_data):
                        if chunk.get('error'):
                            raise HTTPException(status_code=500, detail=chunk['error'])
                        
                        yield f"data: {json.dumps(chunk)}\n\n"
                    
                    yield "data: [DONE]\n\n"
                
                except Exception as e:
                    logger.error(f"Error in MiniGPT-4 stream: {str(e)}")
                    yield f"data: {json.dumps({'error': str(e)})}\n\n"
            
            return StreamingResponse(
                event_stream(),
                media_type="text/event-stream",
                headers={
                    "X-Request-ID": request_id,
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                }
            )
        
        # Handle other models with existing logic
        async def event_stream():
            try:
                # Check Ollama health with retry logic
                try:
                    await check_ollama_health()
                except Exception as e:
                    logger.error(f"Ollama server health check failed after retries: {str(e)}")
                    yield f"data: {{\"error\": \"Ollama server is not available. Please ensure it is running at http://ollama:11434/api/chat\"}}\n\n"
                    return

                # Create a client with longer timeout and retry logic
                async with httpx.AsyncClient(
                    timeout=60.0,
                    limits=httpx.Limits(max_keepalive_connections=5, max_connections=10)
                ) as client:
                    logger.info(f"Making request to Ollama API at {OLLAMA_API_URL}")
                    
                    # Prepare the request
                    request_data = {
                        "model": chat_request.model,
                        "messages": [{"role": m.role, "content": m.content} for m in chat_request.messages],
                        "stream": True
                    }
                    
                    # Make the request with retry logic
                    try:
                        async with client.stream(
                            "POST",
                            OLLAMA_API_URL,
                            json=request_data
                        ) as response:
                            if response.status_code != 200:
                                error_text = await response.text()
                                logger.error(f"Ollama API error: {response.status_code} - {error_text}")
                                raise HTTPException(
                                    status_code=response.status_code,
                                    detail=f"Ollama API error: {error_text}"
                                )

                            async for line in response.aiter_lines():
                                if line.strip():
                                    try:
                                        data = json.loads(line)
                                        if 'message' in data and 'content' in data['message']:
                                            data['message']['content'] = mask_model_names(data['message']['content'])
                                            yield f"data: {json.dumps(data)}\n\n"
                                        else:
                                            yield f"data: {line}\n\n"
                                    except Exception as e:
                                        logger.error(f"Error processing Ollama response line: {str(e)}")
                                        yield f"data: {line}\n\n"
                    except httpx.ConnectError as e:
                        logger.error(f"Failed to connect to Ollama server: {str(e)}")
                        yield f"data: {{\"error\": \"Failed to connect to Ollama server. Please ensure it is running at http://ollama:11434/api/chat\"}}\n\n"
                    except httpx.ReadTimeout as e:
                        logger.error(f"Read timeout from Ollama server: {str(e)}")
                        yield f"data: {{\"error\": \"Request timed out while reading from Ollama server\"}}\n\n"
                    except httpx.WriteTimeout as e:
                        logger.error(f"Write timeout to Ollama server: {str(e)}")
                        yield f"data: {{\"error\": \"Request timed out while writing to Ollama server\"}}\n\n"
                    except Exception as e:
                        logger.error(f"Error in event_stream for /api/chat: {str(e)}", exc_info=True)
                        yield f"data: {{\"error\": \"{str(e)}\"}}\n\n"
            finally:
                ACTIVE_REQUESTS.dec()
        
        return StreamingResponse(event_stream(), media_type="text/event-stream")
    
    except Exception as e:
        ACTIVE_REQUESTS.dec()
        ERROR_COUNT.labels(type=type(e).__name__, endpoint='/api/chat').inc()
        logger.error(f"Exception in /api/chat: {str(e)}", exc_info=True)
        raise

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 