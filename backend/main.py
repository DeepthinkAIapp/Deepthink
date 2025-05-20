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

# Download required NLTK data
nltk.download('punkt')
nltk.download('stopwords')
nltk.download('wordnet')
nltk.download('averaged_perceptron_tagger')

# Load spaCy model
try:
    nlp = spacy.load('en_core_web_sm')
except OSError:
    # If model not found, download it
    spacy.cli.download('en_core_web_sm')
    nlp = spacy.load('en_core_web_sm')

# Load environment variables
load_dotenv()

# Security configuration
SECRET_KEY = os.getenv("SECRET_KEY", "deepthink_ai_secure_key_2024")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable is not set")

# API Configuration
OLLAMA_API_URL = os.getenv("OLLAMA_API_URL", "http://127.0.0.1:11434/api/chat")

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
REQUEST_TIMEOUT = int(os.getenv("REQUEST_TIMEOUT", "200"))  # seconds

# CORS Configuration
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://19a8-2601-681-8400-6350-d929-445-fd8e-ef3f.ngrok-free.app",
    "https://www.deepthinkai.app",
    "https://deepthinkai.app"
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
                async with httpx.AsyncClient(timeout=60.0) as client:
                    async with client.stream(
                        "POST",
                        OLLAMA_API_URL,
                        json={
                            "model": chat_request.model,
                            "messages": [{"role": m.role, "content": m.content} for m in chat_request.messages],
                            "stream": True
                        }
                    ) as response:
                        async for line in response.aiter_lines():
                            if line.strip():
                                try:
                                    data = json.loads(line)
                                    if 'message' in data and 'content' in data['message']:
                                        data['message']['content'] = mask_model_names(data['message']['content'])
                                        yield f"data: {json.dumps(data)}\n\n"
                                    else:
                                        yield f"data: {line}\n\n"
                                except Exception:
                                    yield f"data: {line}\n\n"
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

@app.get("/")
async def root():
    return {"message": "Welcome to DeepThinkAI API"}

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
            response = await client.get("http://127.0.0.1:11434/api/tags")
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
    async with httpx.AsyncClient(timeout=30.0) as client:
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

@app.post("/api/monetize")
async def monetize(request: Request, monetization_request: MonetizationRequest):
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    ACTIVE_REQUESTS.inc()
    logger.info(f"Starting monetization plan request {request_id} for niche: {monetization_request.niche}")
    try:
        # Build messages: system + explicit user prompt
        user_prompt = (
            f"My niche is: {monetization_request.niche}. "
            "Please generate a detailed monetization blueprint for this niche, following your expert planner instructions and the sample output format."
        )
        messages = [
            Message(role="system", content=MONETIZATION_SYSTEM_PROMPT),
            Message(role="user", content=user_prompt)
        ]
        selected_model = select_best_model(messages)
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
                async with httpx.AsyncClient(timeout=60.0) as client:
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
        
        selected_model = select_best_model(messages)
        logger.info(f"Request {request_id}: Using model {selected_model}")
        
        ACTIVE_REQUESTS.inc()
        
        async with httpx.AsyncClient(timeout=60.0) as client:
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

@app.post("/api/guestpost")
async def guestpost(request: Request, guestpost_request: GuestPostRequest):
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    ACTIVE_REQUESTS.inc()
    logger.info(f"Starting guest post outreach request {request_id} for niche: {guestpost_request.niche}")
    try:
        # Build messages: system + explicit user prompt
        user_prompt = guestpost_request.prompt
        messages = [
            Message(role="system", content="You are Deepthink AI, an expert in guest post outreach. Given a user's niche, identify 5-10 high authority websites in that niche that have published articles in the last 3 months, accept guest posts, and analyze for content gaps and good guest post ideas."),
            Message(role="user", content=user_prompt)
        ]
        selected_model = select_best_model(messages)
        async def event_stream():
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
                        async for line in response.aiter_lines():
                            if line.strip():
                                try:
                                    data = json.loads(line)
                                    if 'message' in data and 'content' in data['message']:
                                        data['message']['content'] = mask_model_names(data['message']['content'])
                                        yield f"data: {{\"ideas\": {json.dumps(data['message']['content'])}}}\n\n"
                                    else:
                                        yield f"data: {line}\n\n"
                                except Exception:
                                    yield f"data: {line}\n\n"
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

@app.post("/api/search-intent")
async def search_intent(request: Request, search_intent_request: SearchIntentRequest):
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    ACTIVE_REQUESTS.inc()
    logger.info(f"Starting search intent analysis request {request_id} for keyword: {search_intent_request.keyword}")
    try:
        user_prompt = search_intent_request.prompt
        system_prompt = (
            "Role: You are an advanced AI Search Intent Analyzer, specializing in SEO and content strategy.\n"
            "Task: Analyze the search intent behind given keywords or topics, providing a comprehensive overview that helps content creators align their work with user expectations and search engine preferences. When given a keyword or topic, you will:\n"
            "- Identify the primary intent (informational, navigational, transactional, or commercial investigation)\n"
            "- Craft an enticing H1 search intent title that includes the target keyword plus relevant trigger words. Ensure the title is between 55 and 60 characters.\n"
            "- Analyze and present the following aspects in a markdown table with two columns: Aspect and Details.\n"
            "- For aspects with multiple details, use markdown bullet points (- or *) for lists in the Details cell. Use <br> for line breaks if needed.\n"
            "- Use bold for important terms, italics for examples, and bullet points or line breaks for lists.\n"
            "- After the table, add a section titled 'Why This Works for SEO & Users' in markdown, with bolded section titles and bullet points.\n"
            "- Do not add any text before or after the table and the SEO section.\n"
            "- Follow this example format exactly:\n"
            "\n"
            "| Aspect | Details |\n"
            "|--------|---------|\n"
            "| Primary Intent | **Transactional** (Users are close to purchase, seeking top-rated shoes for marathon) |\n"
            "| H1 Search Intent Title | *Best Marathon Training Shoes for Peak Performance (2024)* |\n"
            "| Content Type & Format | - **Comparison guide** (Top 5-7 shoes with pros/cons)<br>- **Buyer's guide** (Cushioning, stability, weight, durability)<br>- **Data-driven** (Include lab/test results if possible) |\n"
            "| User's Main Goal | Find the most comfortable, high-performance shoes for marathon training |\n"
            "| Key Expectations | - **Brand comparisons** (Nike, Brooks, Hoka, etc.)<br>- **Price ranges** (Budget to premium options)<br>- **Foot type recommendations** (Neutral, overpronation, etc.)<br>- **Real runner reviews** (Not just specs) |\n"
            "| What to Avoid | - Overly technical jargon without explanations<br>- Affiliate links without genuine recommendations<br>- Outdated models (highlight 2023-2024 releases) |\n"
            "| Important Elements to Include | - **Side-by-side comparison table**<br>- **High-quality images/videos** (Show fit, tread, etc.)<br>- **Where to buy** (Amazon, REI, brand sites)<br>- **Alternatives** (If a shoe is sold out) |\n"
            "| Tone and Style | **Authoritative yet approachable** (Like a seasoned runner advising a friend) |\n"
            "| Call-to-Action | *\"Compare prices on trusted retailers\"* |\n"
            "| Key Audience Segments | - **First-time marathoners** (Need durability + comfort)<br>- **Competitive runners** (Seeking lightweight speed shoes)<br>- **Injury-prone runners** (Require max cushioning/stability)<br>- **Budget-conscious buyers** (Under $100 options) |\n"
            "\n"
            "**Why This Works for SEO & Users**\n"
            "1. **Matches high commercial intent** – Users are ready to buy.\n"
            "2. **Covers all query stages:**\n"
            "   - *Research* (comparisons, guides) → *Decision* (pros/cons) → *Purchase* (CTA links).\n"
            "3. **Satisfies E-E-A-T** (Experience, Expertise, Authority, Trustworthiness) with real runner insights.\n"
            "\n"
            "Now, analyze the search intent for the given keyword or topic and output only the markdown table and SEO section in this format.\n"
        )
        messages = [
            Message(role="system", content=system_prompt),
            Message(role="user", content=user_prompt)
        ]
        selected_model = select_best_model(messages)
        async def event_stream():
            try:
                async with httpx.AsyncClient(timeout=180.0) as client:
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

GENERATED_IMAGE_DIR = os.path.join(os.path.dirname(__file__), 'data', 'generated_images')
os.makedirs(GENERATED_IMAGE_DIR, exist_ok=True)

# Add default negative prompt constant
DEFAULT_NEGATIVE_PROMPT = "lowres, text, error, cropped, worst quality, low quality, jpeg artifacts, ugly, duplicate, morbid, mutilated, out of frame, extra fingers, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, blurry, dehydrated, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck, username, watermark, signature"

# Update the ImagePromptRequest model to use the default negative prompt
class ImagePromptRequest(BaseModel):
    prompt: str
    negative_prompt: Optional[str] = DEFAULT_NEGATIVE_PROMPT
    width: Optional[int] = 512
    height: Optional[int] = 512
    steps: Optional[int] = 30
    cfg_scale: Optional[float] = 7.0
    seed: Optional[int] = None
    model: Optional[str] = None
    sampler: Optional[str] = None
    hires_fix: Optional[bool] = False
    face_restore: Optional[bool] = False
    tiling: Optional[bool] = False
    batch_count: Optional[int] = 1
    batch_size: Optional[int] = 1
    denoising_strength: Optional[float] = 0.7
    variation_seed: Optional[int] = None
    seed_resize_width: Optional[int] = 0
    seed_resize_height: Optional[int] = 0
    clip_skip: Optional[int] = None
    eta: Optional[float] = None
    prompt_strength: Optional[float] = None
    input_image: Optional[str] = None
    mask_image: Optional[str] = None

    @field_validator('seed_resize_width', 'seed_resize_height')
    @classmethod
    def validate_seed_resize(cls, v: Optional[int]) -> int:
        if v is not None and v < 0:
            return 0
        return v if v is not None else 0

    @field_validator('width', 'height')
    @classmethod
    def validate_dimensions(cls, v: Optional[int]) -> int:
        if v is not None:
            if v < 64:
                return 64
            if v > 2048:
                return 2048
        return v if v is not None else 512

    @field_validator('steps')
    @classmethod
    def validate_steps(cls, v: Optional[int]) -> int:
        if v is not None:
            if v < 1:
                return 1
            if v > 150:
                return 150
        return v if v is not None else 30

    @field_validator('cfg_scale')
    @classmethod
    def validate_cfg_scale(cls, v: Optional[float]) -> float:
        if v is not None:
            if v < 1.0:
                return 1.0
            if v > 30.0:
                return 30.0
        return v if v is not None else 7.0

    @field_validator('denoising_strength')
    @classmethod
    def validate_denoising_strength(cls, v: Optional[float]) -> float:
        if v is not None:
            if v < 0.0:
                return 0.0
            if v > 1.0:
                return 1.0
        return v if v is not None else 0.7

# Add this function near the top of the file, after the imports
async def check_sd_api_availability():
    """Check if Stable Diffusion API is available"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{SD_WEBUI_URL}/sdapi/v1/sd-models", timeout=5)
            if response.status_code != 200:
                logger.error(f"Stable Diffusion API returned status code {response.status_code}")
                return False
            return True
    except Exception as e:
        logger.error(f"Error checking Stable Diffusion API availability: {str(e)}")
        return False

# Add function to process multi-prompts
def process_multi_prompt(prompt: str) -> str:
    """
    Process a multi-prompt string with weights.
    Example: "space::2 ship::1" -> "space, ship" with appropriate weights
    """
    try:
        # Split the prompt into segments
        segments = [s.strip() for s in prompt.split('::')]
        if len(segments) == 1:
            return prompt  # No multi-prompt, return as is
        
        # Process each segment and its weight
        processed_segments = []
        for i in range(0, len(segments), 2):
            text = segments[i].strip()
            if not text:
                continue
                
            # Get weight if available
            weight = 1.0
            if i + 1 < len(segments):
                try:
                    weight = float(segments[i + 1])
                except ValueError:
                    pass
            
            # Add to processed segments
            if weight > 0:
                # For positive weights, repeat the text based on weight
                repeat_count = max(1, int(weight * 2))  # Scale weight to reasonable repeat count
                processed_segments.extend([text] * repeat_count)
            else:
                # For negative weights, add to negative prompt
                processed_segments.append(f"({text}:{abs(weight)})")
        
        return ", ".join(processed_segments)
    except Exception as e:
        logger.error(f"Error processing multi-prompt: {str(e)}")
        return prompt  # Return original prompt if processing fails

# Helper: Simple image quality check (sharpness + contrast)
def is_high_quality_image(image_bytes, sharpness_thresh=10, contrast_thresh=30):
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        stat = ImageStat.Stat(img)
        # Sharpness: variance of Laplacian (approximate with stddev of grayscale)
        grayscale = img.convert('L')
        sharpness = ImageStat.Stat(grayscale).stddev[0]
        # Contrast: stddev of RGB channels
        contrast = sum(stat.stddev) / 3
        return sharpness > sharpness_thresh and contrast > contrast_thresh
    except Exception as e:
        logger.error(f"Image quality check failed: {e}")
        return False

# Helper: Enhance prompt for best quality
BEST_QUALITY_TAGS = ", masterpiece, ultra-detailed, 8k, award-winning, trending on artstation, best quality, highres, sharp focus, cinematic lighting"
def enhance_for_best_quality(prompt):
    # Add best quality tags if not already present
    if any(tag in prompt for tag in ["masterpiece", "ultra-detailed", "8k", "award-winning", "trending on artstation"]):
        return prompt
    return prompt.strip() + BEST_QUALITY_TAGS

@app.post("/api/generate-image")
async def generate_image(request: ImagePromptRequest):
    logger.info(f"Received image generation request: prompt={request.prompt[:50]}...")
    
    # Process multi-prompt
    processed_prompt = process_multi_prompt(request.prompt)
    logger.info(f"Processed multi-prompt: {processed_prompt}")
    
    # Check if Stable Diffusion API is available
    if not await check_sd_api_availability():
        logger.error("Stable Diffusion API is not available")
        raise HTTPException(
            status_code=503,
            detail="Stable Diffusion API is not available. Please make sure the Stable Diffusion server is running at http://127.0.0.1:7861"
        )

    def call_sd_api(payload, endpoint):
        logger.info(f"Calling SD API endpoint: {endpoint}")
        logger.info(f"Payload: {json.dumps(payload)[:500]}")
        try:
            response = requests.post(endpoint, json=payload, timeout=90)
            logger.info(f"SD API response status: {response.status_code}")
            response.raise_for_status()
            return response
        except Exception as e:
            logger.error(f"Error calling SD API: {e}")
            raise HTTPException(status_code=500, detail=f"Stable Diffusion API error: {e}")

    try:
        # Prepare the payload for Stable Diffusion API
        payload = {
            "prompt": processed_prompt,
            "negative_prompt": request.negative_prompt,
            "width": request.width,
            "height": request.height,
            "steps": request.steps,
            "cfg_scale": request.cfg_scale,
            "seed": request.seed,
            "sampler_name": request.sampler,
            "enable_hr": request.hires_fix,
            "restore_faces": request.face_restore,
            "tiling": request.tiling,
            "batch_count": request.batch_count,
            "batch_size": request.batch_size,
            "denoising_strength": request.denoising_strength,
            "seed_variation": request.variation_seed,
            "seed_resize_from_w": request.seed_resize_width,
            "seed_resize_from_h": request.seed_resize_height,
            "clip_skip": request.clip_skip,
            "eta": request.eta,
            "prompt_strength": request.prompt_strength
        }
        logger.info(f"Prepared payload: {json.dumps(payload)[:500]}")

        # Always use the same logic for txt2img, img2img, and inpainting
        if request.input_image:
            base64_image = request.input_image.split(',')[1] if ',' in request.input_image else request.input_image
            logger.info(f"init_images[0] base64 length: {len(base64_image)}, prefix: {request.input_image[:30]}, first 100: {base64_image[:100]}")
            # DEBUG: Save input image to disk
            try:
                with open('debug_input.png', 'wb') as f:
                    f.write(base64.b64decode(base64_image))
                logger.info('Saved debug_input.png')
            except Exception as e:
                logger.warning(f'Could not save debug_input.png: {e}')
            payload.update({
                "init_images": [base64_image],
                "denoising_strength": request.denoising_strength or 0.7
            })
            if request.mask_image:
                base64_mask = request.mask_image.split(',')[1] if ',' in request.mask_image else request.mask_image
                logger.info(f"mask base64 length: {len(base64_mask)}, prefix: {request.mask_image[:30]}, first 100: {base64_mask[:100]}")
                # Check mask and image size
                try:
                    img_bytes = base64.b64decode(base64_image)
                    mask_bytes = base64.b64decode(base64_mask)
                    img = Image.open(io.BytesIO(img_bytes))
                    mask = Image.open(io.BytesIO(mask_bytes))
                    logger.info(f"input image size: {img.size}, mask size: {mask.size}")
                    if img.size != mask.size:
                        logger.warning(f"Mask size {mask.size} does not match input image size {img.size}. Inpainting may fail or produce unexpected results.")
                    # DEBUG: Save mask to disk
                    with open('debug_mask.png', 'wb') as f:
                        f.write(mask_bytes)
                    logger.info('Saved debug_mask.png')
                except Exception as e:
                    logger.warning(f"Could not check mask/image size or save debug_mask.png: {e}")
                payload["mask"] = base64_mask
            response = call_sd_api(payload, "http://127.0.0.1:7861/sdapi/v1/img2img")
        else:
            response = call_sd_api(payload, "http://127.0.0.1:7861/sdapi/v1/txt2img")

        # Double-check logic: always run after any SD API call
        try:
            result = response.json()
        except Exception as e:
            logger.error(f"Failed to parse SD API response as JSON: {e}")
            raise HTTPException(status_code=500, detail="Stable Diffusion API returned invalid JSON.")
        if not result or not result.get("images"):
            logger.error(f"No images in response from Stable Diffusion API. Response: {result}")
            raise HTTPException(status_code=500, detail="No image generated (SD API returned no images)")

        image_data = base64.b64decode(result["images"][0])
        if not is_high_quality_image(image_data):
            logger.info("Image not high quality, rerunning with best settings...")
            best_payload = payload.copy()
            best_payload["prompt"] = enhance_for_best_quality(processed_prompt)
            best_payload["steps"] = 50
            best_payload["cfg_scale"] = 12
            best_payload["sampler_name"] = "DPM++ 2M Karras"
            best_payload["width"] = max(request.width or 512, 704)
            best_payload["height"] = max(request.height or 512, 704)
            best_payload["seed"] = None
            logger.info(f"Best quality rerun payload: {json.dumps(best_payload)[:500]}")
            if request.input_image:
                response = call_sd_api(best_payload, "http://127.0.0.1:7861/sdapi/v1/img2img")
            else:
                response = call_sd_api(best_payload, "http://127.0.0.1:7861/sdapi/v1/txt2img")
            try:
                result = response.json()
            except Exception as e:
                logger.error(f"Failed to parse SD API rerun response as JSON: {e}")
                raise HTTPException(status_code=500, detail="Stable Diffusion API (rerun) returned invalid JSON.")
            if not result or not result.get("images"):
                logger.error(f"No images in response from SD rerun. Response: {result}")
                raise HTTPException(status_code=500, detail="No image generated (rerun, SD API returned no images)")
            image_data = base64.b64decode(result["images"][0])

        # Save the generated image (best one)
        try:
            logger.info("Saving generated image")
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"generated_{timestamp}.png"
            filepath = os.path.join("data", "generated_images", filename)
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            with open(filepath, "wb") as f:
                f.write(image_data)

            # Store image metadata in database
            logger.info("Storing image metadata in database")
            async with get_db_connection() as conn:
                await execute_with_retry(conn, """
                    INSERT INTO generated_images 
                    (user_id, prompt, negative_prompt, file_path, width, height, steps, 
                    cfg_scale, seed, model, sampler, input_image, mask_image)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    "default_user",  # Replace with actual user ID when auth is implemented
                    request.prompt,
                    request.negative_prompt,
                    f"/data/generated_images/{filename}",
                    request.width,
                    request.height,
                    request.steps,
                    request.cfg_scale,
                    request.seed,
                    request.model,
                    request.sampler,
                    request.input_image,
                    request.mask_image
                ))

            logger.info(f"Successfully generated and saved image: {filename}")
            return {"file_path": f"/data/generated_images/{filename}"}
        except Exception as e:
            logger.error(f"Error saving generated image: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Error saving generated image: {str(e)}")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in generate_image: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@app.get("/api/generated-images")
async def get_generated_images(
    user_id: str = "default_user",  # Replace with actual user ID when auth is implemented
    limit: int = 20,
    offset: int = 0
):
    try:
        async with get_db_connection() as conn:
            async with conn.execute("""
                SELECT * FROM generated_images 
                WHERE user_id = ? 
                ORDER BY timestamp DESC 
                LIMIT ? OFFSET ?
            """, (user_id, limit, offset)) as cursor:
                rows = await cursor.fetchall()
                return [dict(row) for row in rows]
    except Exception as e:
        logger.error(f"Error fetching generated images: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Mount the generated images directory as a static files route
app.mount("/data/generated_images", StaticFiles(directory="data/generated_images"), name="generated_images")

# Add new endpoint for model listing
@app.get("/api/models")
async def get_models():
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{SD_WEBUI_URL}/sdapi/v1/sd-models")
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch models from SD WebUI")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Add new endpoint for usage statistics
@app.get("/api/stats")
async def get_stats():
    try:
        async with get_db_connection() as conn:
            # Get total images generated
            async with conn.execute("SELECT COUNT(*) as total FROM generated_images") as cursor:
                total_images = (await cursor.fetchone())['total']
            
            # Get total time spent (estimated based on steps)
            async with conn.execute("SELECT SUM(steps) as total_steps FROM generated_images") as cursor:
                total_steps = (await cursor.fetchone())['total_steps'] or 0
                # Estimate time: 1 step ≈ 0.1 seconds
                estimated_time_saved = total_steps * 0.1
            
            # Get most used models
            async with conn.execute("""
                SELECT model, COUNT(*) as count 
                FROM generated_images 
                GROUP BY model 
                ORDER BY count DESC 
                LIMIT 5
            """) as cursor:
                popular_models = await cursor.fetchall()
            
            # Get recent activity (last 24 hours)
            async with conn.execute("""
                SELECT COUNT(*) as recent_count 
                FROM generated_images 
                WHERE timestamp >= datetime('now', '-1 day')
            """) as cursor:
                recent_activity = (await cursor.fetchone())['recent_count']
            
            return {
                "total_images": total_images,
                "estimated_time_saved": round(estimated_time_saved, 2),  # in seconds
                "popular_models": [dict(row) for row in popular_models],
                "recent_activity": recent_activity
            }
    except Exception as e:
        logger.error(f"Error fetching stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/content-outline-keywords")
async def content_outline_keywords(request: Request):
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    logger.info(f"Request {request_id}: Received keyword/article ideas request")
    
    try:
        body = await request.json()
        sub_niche = body.get("sub_niche", "").strip()
        
        if not sub_niche:
            raise HTTPException(status_code=400, detail="sub_niche is required")
        
        # Enhanced prompt with specific instructions and format
        prompt = (
            f"For the sub-niche: {sub_niche}, generate:\n"
            "1. 15 informational article ideas (easy to rank for)\n"
            "2. 5 transactional/affiliate post ideas\n"
            "3. 2 pillar posts (1 affiliate, 1 informational)\n\n"
            "Format the response as a Markdown table with the following columns:\n"
            "| Type | Title | Target Keyword | Difficulty | Notes |\n"
            "|------|-------|----------------|------------|-------|\n\n"
            "For Type, use: 'Informational', 'Transactional', or 'Pillar'\n"
            "For Difficulty, use: 'Easy', 'Medium', or 'Hard'\n"
            "Ensure all titles are SEO-optimized and include the target keyword naturally."
        )
        
        messages = [
            Message(role="system", content="You are an expert content strategist and SEO specialist."),
            Message(role="user", content=prompt)
        ]
        
        selected_model = select_best_model(messages)
        logger.info(f"Request {request_id}: Using model {selected_model}")
        
        ACTIVE_REQUESTS.inc()
        
        async with httpx.AsyncClient(timeout=60.0) as client:
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
            
            # Clean and validate the response
            content_clean = re.sub(r'^```[a-zA-Z]*|^```|```$', '', content.strip(), flags=re.MULTILINE).strip()
            
            # Validate table structure
            lines = content_clean.split('\n')
            if len(lines) < 3:  # Need header, separator, and at least one row
                logger.warning(f"Request {request_id}: Invalid table structure in response")
                return {"table_markdown": content_clean}
            
            # Fix common table formatting issues
            fixed_content = fix_markdown_table(content_clean)
            
            # Validate table has required columns
            header_line = lines[0].lower()
            required_columns = ['type', 'title', 'target keyword']
            if not all(col in header_line for col in required_columns):
                logger.warning(f"Request {request_id}: Missing required columns in table")
                return {"table_markdown": content_clean}
            
            return {"table_markdown": fixed_content}
            
    except json.JSONDecodeError:
        logger.error(f"Request {request_id}: Invalid JSON in request body")
        raise HTTPException(status_code=400, detail="Invalid JSON in request body")
    except Exception as e:
        logger.error(f"Request {request_id}: Error in keyword/article ideas: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        ACTIVE_REQUESTS.dec()

def fix_markdown_table(md: str) -> str:
    """Fix common Markdown table formatting issues."""
    lines = md.split('\n')
    if len(lines) < 3:
        return md
        
    # Ensure header and separator are properly formatted
    header = lines[0].strip()
    if not header.startswith('|'):
        header = '|' + header
    if not header.endswith('|'):
        header = header + '|'
    
    # Fix separator line
    separator = lines[1].strip()
    if not separator.startswith('|'):
        separator = '|' + separator
    if not separator.endswith('|'):
        separator = separator + '|'
    
    # Fix data rows
    fixed_lines = [header, separator]
    for line in lines[2:]:
        line = line.strip()
        if not line:
            continue
        if not line.startswith('|'):
            line = '|' + line
        if not line.endswith('|'):
            line = line + '|'
        fixed_lines.append(line)
    
    return '\n'.join(fixed_lines)

@app.post("/api/affiliate-article-ideas")
async def affiliate_article_ideas(request: Request):
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    logger.info(f"Request {request_id}: Received affiliate article ideas request")
    try:
        body = await request.json()
        prompt = body.get("prompt", "")
        sub_niche = body.get("sub_niche", "")
        if not prompt or not sub_niche:
            raise HTTPException(status_code=400, detail="Prompt and sub_niche are required")
        messages = [
            Message(role="system", content=prompt),
            Message(role="user", content=f"Generate 20 targeted transactional affiliate article ideas for the sub-niche: {sub_niche}")
        ]
        selected_model = select_best_model(messages)
        ACTIVE_REQUESTS.inc()
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                OLLAMA_API_URL,
                json={
                    "model": selected_model,
                    "messages": [{"role": m.role, "content": m.content} for m in messages],
                    "stream": False
                }
            )
            response.raise_for_status()
            data = response.json()
            content = data.get("message", {}).get("content", "")
            # Strip Markdown code block formatting if present
            content_clean = re.sub(r'^```[a-zA-Z]*|^```|```$', '', content.strip(), flags=re.MULTILINE).strip()
            return {"content": content_clean}
    except Exception as e:
        logger.error(f"Request {request_id}: Error in affiliate article ideas: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/youtube-content-planner")
async def youtube_content_planner(request: Request):
    import re
    import json as pyjson
    data = await request.json()
    prompt = data.get("prompt", "")
    niche = data.get("niche", "")
    subniche = data.get("subniche", "")
    model = "mistral:latest"

    # Step 1: Generate subniches and topic ideas
    if prompt and niche and not subniche:
        user_prompt = f"My main niche is: {niche}. Please generate 5 sub-niches and 5 YouTube topic ideas for each, following your expert instructions."
        messages = [
            Message(role="system", content=prompt),
            Message(role="user", content=user_prompt)
        ]
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                OLLAMA_API_URL,
                json={
                    "model": model,
                    "messages": [{"role": m.role, "content": m.content} for m in messages],
                    "stream": False
                }
            )
            response.raise_for_status()
            data = response.json()
            content = data.get("message", {}).get("content", "")
            # Try to extract JSON if present
            try:
                content_clean = re.sub(r'^```json|^```|```$', '', content.strip(), flags=re.MULTILINE).strip()
                parsed = pyjson.loads(content_clean)
                if isinstance(parsed, dict) and "subniches" in parsed and "topicIdeas" in parsed:
                    return {"subniches": parsed["subniches"], "topicIdeas": parsed["topicIdeas"]}
            except Exception:
                # Fallback: parse from markdown or text
                lines = content.splitlines()
                subniches = []
                topicIdeas = {}
                current_sub = None
                for line in lines:
                    sub_match = re.match(r"\d+\.\s*(.+)", line)
                    if sub_match:
                        current_sub = sub_match.group(1).strip()
                        subniches.append(current_sub)
                        topicIdeas[current_sub] = []
                    elif current_sub and (line.strip().startswith("-") or line.strip().startswith("*")):
                        topic = line.split(" ", 1)[-1].strip("-* ").strip()
                        if topic:
                            topicIdeas[current_sub].append(topic)
                if subniches and topicIdeas:
                    return {"subniches": subniches, "topicIdeas": topicIdeas}
            # Fallback: return raw content
            return {"content": content}

    # Step 2: Generate video ideas for a subniche
    if prompt and niche and subniche:
        user_prompt = f"My main niche is: {niche}. My chosen sub-niche is: {subniche}. Please generate 20 YouTube video ideas (title + target keyword) and guidance, following your expert instructions."
        messages = [
            Message(role="system", content=prompt),
            Message(role="user", content=user_prompt)
        ]
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                OLLAMA_API_URL,
                json={
                    "model": model,
                    "messages": [{"role": m.role, "content": m.content} for m in messages],
                    "stream": False
                }
            )
            response.raise_for_status()
            data = response.json()
            content = data.get("message", {}).get("content", "")
            # Try to extract table rows
            videoIdeas = []
            table_rows = re.findall(r"\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|", content)
            for row in table_rows:
                title, keyword = row
                if title.lower() != "video title" and keyword.lower() != "target keyword":
                    videoIdeas.append({"title": title.strip(), "keyword": keyword.strip()})
            # Try to extract guidance (look for a section after the table)
            guidance = ""
            guidance_match = re.search(r"Guidance[:\n]+(.+)", content, re.DOTALL | re.IGNORECASE)
            if guidance_match:
                guidance = guidance_match.group(1).strip()
            if videoIdeas:
                return {"videoIdeas": videoIdeas, "guidance": guidance}
            # Fallback: return raw content
            return {"content": content}

    return JSONResponse({"error": "Invalid request"}, status_code=400)

# Mount the generated videos directory as a static files route
GENERATED_VIDEO_DIR = os.path.join(os.path.dirname(__file__), 'data', 'generated_videos')
os.makedirs(GENERATED_VIDEO_DIR, exist_ok=True)
app.mount("/data/generated_videos", StaticFiles(directory=GENERATED_VIDEO_DIR), name="generated_videos")

@app.get("/api/generated-videos")
async def get_generated_videos():
    """List all generated video files."""
    try:
        files = []
        for fname in os.listdir(GENERATED_VIDEO_DIR):
            if fname.lower().endswith(('.mp4', '.mov', '.avi', '.webm')):
                files.append({
                    "filename": fname,
                    "url": f"/data/generated_videos/{fname}"
                })
        return {"videos": files}
    except Exception as e:
        logger.error(f"Error listing generated videos: {str(e)}")
        raise HTTPException(status_code=500, detail="Error listing generated videos")

@app.post("/api/upload-video")
async def upload_video(video: UploadFile = File(...)):
    try:
        # Create a unique filename using timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{timestamp}_{video.filename}"
        file_path = os.path.join("data/generated_videos", filename)
        
        # Save the uploaded file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(video.file, buffer)
        
        return JSONResponse({
            "message": "Video uploaded successfully",
            "filename": filename,
            "path": f"/data/generated_videos/{filename}"
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        video.file.close()

DEFORUM_API_URL = "http://localhost:7860/deforum_api/batches"

from fastapi import APIRouter
router = APIRouter()

def fix_deforum_schedules(settings):
    # List of schedule fields that must be strings
    schedule_fields = [
        "cfg_scale_schedule", "steps_schedule", "init_scale_schedule", "latent_scale_schedule",
        "image_strength_schedule", "blendFactorMax", "blendFactorSlope", "tweening_frames_schedule",
        "color_correction_factor"
    ]
    for field in schedule_fields:
        value = settings.get(field)
        if isinstance(value, list):
            # Convert [15] -> "0:(15)"
            if len(value) > 0:
                settings[field] = f"0:({value[0]})"
        elif isinstance(value, dict):
            # Convert {"0": 25} -> "0:(25)"
            settings[field] = ",".join(f"{k}:({v})" for k, v in value.items())
    return settings

# Add this function after the imports
def copy_deforum_video_to_served_dir(deforum_video_path: str) -> str:
    """Copy a Deforum-generated video to the backend's served directory."""
    try:
        if not os.path.exists(deforum_video_path):
            raise FileNotFoundError(f"Deforum video not found: {deforum_video_path}")
        
        # Get the filename from the path
        filename = os.path.basename(deforum_video_path)
        
        # Create the destination path in the backend's served directory
        dest_path = os.path.join(GENERATED_VIDEO_DIR, filename)
        
        # Copy the file
        shutil.copy2(deforum_video_path, dest_path)
        
        # Return the URL path that the frontend can use
        return f"/data/generated_videos/{filename}"
    except Exception as e:
        logger.error(f"Error copying Deforum video: {str(e)}")
        raise

@router.post("/api/deforum-generate")
async def deforum_generate(user_settings: dict = Body(...)):
    # Try to load defaults from C:\llama\settings\deforum.txt
    settings_path = r"C:\llama\settings\deforum.txt"
    file_defaults = None
    if os.path.exists(settings_path):
        try:
            with open(settings_path, "r", encoding="utf-8") as f:
                file_defaults = json.load(f)
        except Exception as e:
            file_defaults = None
            # Optionally log error
    # Fallback hardcoded defaults
    hard_defaults = {
        "animation_mode": "2D",
        "max_frames": 188,
        "W": 512,
        "H": 512,
        "seed": 42,
        "sampler": "Euler a",
        "steps": 20,
        "scale": 7.0,
        "animation_prompts": {
            "0": "masterpiece, a man walking past a mural of a leopard on a wall, anamorphic, Indian themes, Indian art, Indian art wall, graffiti art, video art, Full HD, vibrant colours, dynamic lighting, ultra high detail, dramatic lighting, movie, poster, asymmetric composition, ultra detailed, Photorealistic, unreal engine, art by Johnson Ting neg ",
            "30": "masterpiece, Traveller walking in street of footpath of a tiger or leopard on a wall ,Indian, tiger, elephant, animals, metropolis, Nagpur city skyline, Leopard wall in the background, art, cyberpunk tiger, futuristic, a astronauts walking on  past a mural of a leopard on a wall, birds, bright colourful, photo realistic, Natural Lighting, dynamic lighting, ultra-high detail, dramatic lighting, movie, poster, asymmetric composition, ultra detailed, Photorealistic, unreal engine, art by Johnson Ting neg ",
            "60": "masterpiece, a man walking past a mural of a leopard on a wall, Traveller waking on the footpath , forest, lion, cat, metropolis, Indian themes, trees, beach and palm trees, As the sun gently bathed the vibrant city streets, a man strolled leisurely, his steps casting a rhythmic melody against the pavement. His eyes wandered, absorbing the kaleidoscope of colours that surrounded him, until they locked onto a mesmerizing mural adorning a weathered wall. A majestic leopard, its sleek coat painted with lifelike precision, commanded attention, exuding an aura of wild grace, airbus airplane, bright colourful, photo realistic, India, words, Boston, New York, Sydney, Los Angeles, Tokyo, Singapore, Paris, Ball, palm trees, Eifel tower, cocktail, Europe, statue of liberty photo, Tourists, Natural Lighting, dynamic lighting, ultra high detail, dramatic lighting, movie, asymmetric composition, ultra detailed, Photorealistic, unreal engine, art by Johnson Ting -neg ",
            "90": "masterpiece, A man walking , wild life, Futuristic Kuala Lumpur cyberpunk forest, Kuala Lumpur, coloured, futuristic artwork, jungle, forest art style, morning, As the man drew closer, the mural seemed to come alive, as if the leopard's piercing eyes were beckoning him into a realm where untamed wonders awaited. In the background, a symphony of wilderness echoed softly, the distant calls of tropical birds blending with the rustling of leaves and the gentle roar of a distant waterfall,  futuristic forest, rockets, epic scene, displaying in the background futuristic city buildings and many cyborgs, perspective view, Full HD, vibrant colours, dynamic lighting, ultra-high detail, dramatic lighting, movie poster style, asymmetric composition, ultra detailed, photorealistic, unreal engine, art by Johnson Ting -neg",
            "150": "masterpiece, Full body Robot Al with somewhat photorealistic humanoid features looking directly wall of leopard, moving parts within this leopard or tiger, trees, scary lion, natural, naturals, stardust, sci-fi Futuristic forest, mechanics, epic scene, displaying in the background futuristic city buildings and many cyborgs, perspective view, Full HD, vibrant colours, dynamic lighting, ultra high detail, dramatic lighting, movie poster style, asymmetric composition, ultra detailed, Photorealistic, unreal engine, Bart by Johnson Ting -neg",
            "240": "masterpiece, a super hero walking past a mural of a leopard on a wall , avengers infinity war, epic battle scene, Captivated by the mural's essence, the man paused, his curiosity awakened. Thoughts of vast savannas and dense rainforests swirled in his mind, as his imagination conjured images of rhinos grazing in golden grasslands, elephants trumpeting beneath a crimson sunset, and jaguars prowling through moonlit jungles, He felt a deep connection to the animal kingdom, recognizing the profound interconnectedness of all living beings, full-length dynamic pose avenger iron man in super hero costume, marvel universe style, pear axe hammer intricate detailed, magic light, New York city in the background, Thunder and lightning, rich colours, dynamic lighting, ultra high detail, dramatic lighting, movie poster style, asymmetric composition, ultra detailed, Photorealistic, unreal engine, art by Johnson Ting--neg",
            "350": "masterpiece, astronaut walking past a mural of a leopard on a wall right side of his face, Cinematic still shot, epic scene, displaying in the background the moon and other planets and stars, galaxy, gravity movie, movie poser, vibrant colours, dynamic lighting, ultra high detail, dramatic lighting, movie poster style, asymmetric composition, ultra detailed, Photorealistic, unreal engine, art by Johnson Ting--neg",
            "480": "masterpiece, walking Star Wars in Wes Anderson style, natural, forest, animals , wild life, birds, sky, wild life trees, leaves, hyper realistic photography, trees, 8k, star wars, outer space, galaxy, animals, Full Body, Concept Art, Cinematic, Dark, 20, 4k, Powerful, Natural Lighting, dynamic lighting, ultra high detail, dramatic lighting, movie, asymmetric composition, ultra detailed, Photorealistic, unreal engine, art by Johnson Ting -neg"
        },
        "strength_schedule": "0:(0.65),25:(0.55)",
        "translation_z": "0:(0.2),60:(10),300:(15)",
        "rotation_3d_x": "0:(0),60:(0),90:(0.5),180:(0.5),300:(0.5)",
        "rotation_3d_y": "0:(0),30:(-3.5),90:(0.5),180:(-2.8),300:(-2),420:(0)",
        "rotation_3d_z": "0:(0),60:(0.2),90:(0),180:(-0.5),300:(0),420:(0.5),500:(0.8)",
        "fov_schedule": "0:(120)",
        "noise_schedule": "0:(-0.06*(cos(3.141*t/15)**100)+0.06)",
        "anti_blur_as": "0:(0.05)",
    }
    # Use file defaults if available, else hard defaults
    base_defaults = file_defaults if file_defaults else hard_defaults
    # Merge user_settings on top
    deforum_settings = {**base_defaults, **user_settings}
    deforum_settings = fix_deforum_schedules(deforum_settings)
    # Ensure the model is set correctly for Deforum
    if 'model' in user_settings and user_settings['model']:
        deforum_settings['sd_model_name'] = user_settings['model']
    elif 'sd_model_name' in user_settings and user_settings['sd_model_name']:
        deforum_settings['sd_model_name'] = user_settings['sd_model_name']
    # Optionally, remove 'model' key to avoid confusion
    if 'model' in deforum_settings:
        del deforum_settings['model']
    payload = {
        "deforum_settings": deforum_settings,
        "options_overrides": {}
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(DEFORUM_API_URL, json=payload)
        if response.status_code == 202:
            data = response.json()
            batch_id = data.get("batch_id")
            
            # Poll for completion and get video path
            while True:
                status_response = await client.get(f"{DEFORUM_API_URL}?id={batch_id}")
                if status_response.status_code == 200:
                    status_data = status_response.json()
                    if status_data.get("status") == "completed":
                        # Get the video path from the response
                        video_path = status_data.get("output_video_path")
                        if video_path:
                            try:
                                # Copy the video to the backend's served directory
                                video_url = copy_deforum_video_to_served_dir(video_path)
                                return {
                                    "batch_id": batch_id,
                                    "status": "completed",
                                    "video_url": video_url
                                }
                            except Exception as e:
                                logger.error(f"Error copying video: {str(e)}")
                                return {
                                    "batch_id": batch_id,
                                    "status": "completed",
                                    "error": str(e)
                                }
                        break
                await asyncio.sleep(5)  # Wait 5 seconds before next poll
            
            return data
        else:
            raise HTTPException(status_code=response.status_code, detail=response.text)

@router.post("/api/deforum-stop")
async def deforum_stop(data: dict = Body(...)):
    batch_id = data.get("batch_id")
    if not batch_id:
        raise HTTPException(status_code=400, detail="batch_id is required")
    # Forward the stop request to Deforum API
    cancel_url = "http://localhost:7860/deforum_api/cancel"
    async with httpx.AsyncClient() as client:
        response = await client.post(cancel_url, json={"id": batch_id})
        if response.status_code == 200:
            return {"status": "stopped"}
        else:
            raise HTTPException(status_code=response.status_code, detail=response.text)

# Register the router
app.include_router(router)

# Create directories for uploaded files
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), 'data', 'uploads')
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Mount the uploads directory as a static files route
app.mount("/data/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.post("/api/upload-image")
async def upload_image(image: UploadFile = File(...)):
    """Upload an image file."""
    try:
        # Validate file type
        if not image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")

        # Create a unique filename using timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{timestamp}_{image.filename}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        # Save the uploaded file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        return JSONResponse({
            "message": "Image uploaded successfully",
            "filename": filename,
            "url": f"/data/uploads/{filename}",
            "path": file_path  # Return the full file path
        })
    except Exception as e:
        logger.error(f"Error uploading image: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        image.file.close()

@app.post("/api/backlink/forms")
async def detect_backlink_forms(payload: Dict[str, Any] = Body(...)):
    directory_url = payload.get("directory_url")
    if not directory_url:
        return {"error": "Missing directory_url"}
    forms = scraper.find_submission_forms(directory_url, max_pages=3)
    return {"forms": forms}

@app.post("/api/backlink/submit")
async def submit_backlink_form(payload: Dict[str, Any] = Body(...)):
    return await selenium_submitter.submit_form(payload)

def calculate_authority_score(backlink_data: Dict[str, Any]) -> float:
    """
    Calculate authority score using methodology similar to Ahrefs' DR:
    1. Consider unique domains (referring domains)
    2. Weight the authority of linking domains
    3. Consider link distribution
    4. Apply logarithmic scaling
    5. Plot on a 100-point scale
    """
    total_backlinks = backlink_data['total']
    
    # Updated weights to reflect new priorities
    # Bing is primary source, DuckDuckGo secondary
    weights = {
        'bing': 1.0,        # Primary source
        'duckduckgo': 0.8,  # Secondary source
        'mojeek': 0.6,      # Additional sources
        'yandex': 0.6,
        'brave': 0.5,
        'yahoo': 0.5,
        'baidu': 0.4,
        'google': 0.3       # Least reliable due to anti-bot measures
    }
    
    weighted_total = 0
    active_sources = 0
    
    # Calculate weighted total and count active sources
    for engine, weight in weights.items():
        if engine in backlink_data and backlink_data[engine] > 0:
            weighted_total += backlink_data[engine] * weight
            active_sources += 1
    
    # Apply logarithmic scaling (log base 10)
    # This helps handle the huge range of backlink counts
    import math
    if weighted_total > 0:
        log_score = math.log10(weighted_total)
        # Scale to 0-100 range
        # Typical max log10 value for top sites is ~7 (10M backlinks)
        authority_score = min(100, int((log_score / 7) * 100))
    else:
        authority_score = 0
        
    # Enhanced diversity bonus based on source reliability
    diversity_bonus = 0
    if backlink_data.get('bing', 0) > 0:
        diversity_bonus += 5  # Bonus for primary source
    if backlink_data.get('duckduckgo', 0) > 0:
        diversity_bonus += 3  # Bonus for secondary source
    
    # Additional bonus for other sources
    other_sources = sum(1 for engine in ['mojeek', 'yandex', 'brave', 'yahoo', 'baidu', 'google']
                       if backlink_data.get(engine, 0) > 0)
    diversity_bonus += other_sources * 1  # 1 point per additional source
    
    # Apply diversity bonus but maintain max 100
    final_score = min(100, authority_score + diversity_bonus)
    
    return final_score

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/91.0.864.59 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1"
]

def get_random_user_agent() -> str:
    return random.choice(USER_AGENTS)

def get_selenium_options() -> EdgeOptions:
    options = webdriver.EdgeOptions()
    options.add_argument('--headless')
    options.add_argument('--disable-gpu')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--disable-blink-features=AutomationControlled')
    options.add_argument(f'--user-agent={get_random_user_agent()}')
    # Additional options to help avoid detection
    options.add_argument('--disable-infobars')
    options.add_argument('--disable-browser-side-navigation')
    options.add_argument('--disable-features=IsolateOrigins,site-per-process')
    options.add_experimental_option('excludeSwitches', ['enable-automation'])
    options.add_experimental_option('useAutomationExtension', False)
    return options

def get_headers() -> Dict[str, str]:
    return {
        "User-Agent": get_random_user_agent(),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Cache-Control": "max-age=0"
    }

# Update the get_bing_count function to use the new headers
def get_bing_count(domain):
    try:
        url = f"https://www.bing.com/search?q=site:{domain}"
        headers = get_headers()
        print(f"Making request to Bing: {url}")
        resp = requests.get(url, headers=headers, timeout=10)
        print(f"Bing response status: {resp.status_code}")
        if resp.status_code != 200:
            print(f"Bing error response: {resp.text}")
            return 0
        soup = BeautifulSoup(resp.text, 'html.parser')
        results_text = None
        possible_selectors = [
            'span.sb_count',
            'div.sb_count',
            'span.count',
            'div.count',
            'span[class*="count"]',
            'div[class*="count"]'
        ]
        for selector in possible_selectors:
            results_text = soup.select_one(selector)
            if results_text:
                break
        if results_text:
            print(f"Bing found results text: {results_text.text}")
            match = re.search(r'([\d,]+)', results_text.text)
            if match:
                count = int(match.group(1).replace(',', ''))
                print(f"Bing extracted count: {count}")
                return count
        else:
            print("Bing: No results count found in the page")
            print("Bing page content:", resp.text[:500])
        return 0
    except Exception as e:
        print(f"Error getting Bing count: {str(e)}")
        return 0

# Update the get_duckduckgo_count function to use the new headers
def get_duckduckgo_count(domain):
    try:
        url = f"https://duckduckgo.com/html/?q=site:{domain}"
        headers = get_headers()
        print(f"Making request to DuckDuckGo: {url}")
        resp = requests.get(url, headers=headers, timeout=10)
        print(f"DuckDuckGo response status: {resp.status_code}")
        if resp.status_code != 200:
            print(f"DuckDuckGo error response: {resp.text}")
            return 0
        soup = BeautifulSoup(resp.text, 'html.parser')
        results = soup.select('.result')
        count = len(results)
        print(f"DuckDuckGo extracted count: {count}")
        return count
    except Exception as e:
        print(f"Error getting DuckDuckGo count: {str(e)}")
        return 0

# Update the Selenium functions to use the new options
def get_google_count_selenium(domain):
    try:
        options = get_selenium_options()
        logger.info("Starting Edge WebDriver for Google search...")
        service = Service(EdgeChromiumDriverManager().install())
        driver = webdriver.Edge(service=service, options=options)
        try:
            # First try with site: operator
            url = f"https://www.google.com/search?q=site:{domain}"
            logger.info(f"Making request to Google with Selenium: {url}")
            driver.get(url)
            
            # Check if we hit a CAPTCHA
            if "detected unusual traffic" in driver.page_source.lower():
                logger.warning("Google CAPTCHA detected, trying alternative approach...")
                # Try alternative approach using inurl: operator
                url = f"https://www.google.com/search?q=inurl:{domain}"
                driver.get(url)
            
            # Wait for any element that might contain results count
            logger.info("Waiting for Google results...")
            try:
                # Try different selectors that might contain the results count
                selectors = [
                    (By.ID, "result-stats"),
                    (By.CLASS_NAME, "sb_count"),
                    (By.CSS_SELECTOR, "#resultStats"),
                    (By.XPATH, "//div[contains(text(), 'results')]")
                ]
                
                for by, selector in selectors:
                    try:
                        element = WebDriverWait(driver, 2).until(
                            EC.presence_of_element_located((by, selector))
                        )
                        stats_text = element.text
                        logger.info(f"Google found stats text: {stats_text}")
                        
                        # Extract number from text
                        match = re.search(r'([\d,]+)', stats_text)
                        if match:
                            count = int(match.group(1).replace(',', ''))
                            logger.info(f"Google extracted count: {count}")
                            return count
                    except:
                        continue
                
                # If no stats found, try counting results
                results = driver.find_elements(By.CSS_SELECTOR, "div.g")
                count = len(results)
                logger.info(f"Google found {count} results by counting elements")
                return count
            
            except Exception as e:
                logger.error(f"Error extracting Google results: {str(e)}")
                return 0
            
        except Exception as e:
            logger.error(f"Error during Google search: {str(e)}")
            try:
                logger.error(f"Google page source: {driver.page_source[:500]}")
            except:
                pass
            return 0
        finally:
            try:
                driver.quit()
                logger.info("Google WebDriver closed successfully")
            except Exception as e:
                logger.error(f"Error closing Google WebDriver: {str(e)}")
    except Exception as e:
        logger.error(f"Error initializing Google WebDriver: {str(e)}")
        return 0

def get_brave_count_selenium(domain):
    try:
        options = get_selenium_options()
        logger.info("Starting Edge WebDriver for Brave search...")
        service = Service(EdgeChromiumDriverManager().install())
        driver = webdriver.Edge(service=service, options=options)
        try:
            # Try different search approaches
            urls = [
                f"https://search.brave.com/search?q=site:{domain}",
                f"https://search.brave.com/search?q=inurl:{domain}"
            ]
            
            for url in urls:
                try:
                    logger.info(f"Making request to Brave with Selenium: {url}")
                    driver.get(url)
                    
                    # Wait for results
                    logger.info("Waiting for Brave search results...")
                    
                    # Try different selectors for results
                    selectors = [
                        "div[data-testid='result']",
                        "div.result",
                        "div.snippet",
                        "div.search-result"
                    ]
                    
                    for selector in selectors:
                        try:
                            WebDriverWait(driver, 2).until(
                                EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                            )
                            results = driver.find_elements(By.CSS_SELECTOR, selector)
                            count = len(results)
                            if count > 0:
                                logger.info(f"Brave found {count} results")
                                return count
                        except:
                            continue
                    
                except Exception as e:
                    logger.error(f"Error with Brave URL {url}: {str(e)}")
                    continue
            
            logger.warning("No results found in Brave search")
            return 0
            
        except Exception as e:
            logger.error(f"Error during Brave search: {str(e)}")
            try:
                logger.error(f"Brave page source: {driver.page_source[:500]}")
            except:
                pass
            return 0
        finally:
            try:
                driver.quit()
                logger.info("Brave WebDriver closed successfully")
            except Exception as e:
                logger.error(f"Error closing Brave WebDriver: {str(e)}")
    except Exception as e:
        logger.error(f"Error initializing Brave WebDriver: {str(e)}")
        return 0

@app.post("/api/minigpt4-chat")
async def minigpt4_chat(prompt: str = Body(...), image: str = Body(...)):
    try:
        result = await call_minigpt4_gradio(prompt, image)
        return {"response": result}
    except Exception as e:
        logger.error(f"MiniGPT-4 Gradio API error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"MiniGPT-4 error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 