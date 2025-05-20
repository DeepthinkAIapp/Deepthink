import os
from pyngrok import ngrok, conf
from dotenv import load_dotenv
import logging
import uvicorn
from fastapi import FastAPI
import asyncio
from contextlib import asynccontextmanager
import signal
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Get ngrok auth token from environment variable
NGROK_AUTH_TOKEN = os.getenv("NGROK_AUTH_TOKEN")
if not NGROK_AUTH_TOKEN:
    logger.warning("NGROK_AUTH_TOKEN not found in environment variables. Using free tier.")

# Configure ngrok
def setup_ngrok():
    try:
        # Set auth token if available
        if NGROK_AUTH_TOKEN:
            conf.get_default().auth_token = NGROK_AUTH_TOKEN
        
        # Configure ngrok
        conf.get_default().region = "us"  # or "eu", "ap", "au", "sa", "jp", "in"
        conf.get_default().monitor_thread = False
        
        # Open ngrok tunnel
        port = 8000
        public_url = ngrok.connect(port, "http", url="https://19a8-2601-681-8400-6350-d929-445-fd8e-ef3f.ngrok-free.app").public_url
        logger.info(f"ngrok tunnel established at: {public_url}")
        return public_url
    except Exception as e:
        logger.error(f"Failed to setup ngrok: {str(e)}")
        sys.exit(1)

def cleanup_ngrok():
    """Cleanup ngrok tunnels on shutdown"""
    try:
        ngrok.kill()
        logger.info("ngrok tunnels closed")
    except Exception as e:
        logger.error(f"Error closing ngrok tunnels: {str(e)}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Setup ngrok on startup
    public_url = setup_ngrok()
    app.state.ngrok_url = public_url
    
    yield
    
    # Cleanup on shutdown
    cleanup_ngrok()

def signal_handler(signum, frame):
    """Handle shutdown signals"""
    logger.info("Shutdown signal received")
    cleanup_ngrok()
    sys.exit(0)

if __name__ == "__main__":
    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Import the FastAPI app
    from main import app
    
    # Add lifespan context manager
    app.router.lifespan_context = lifespan
    
    # Start the server
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    ) 