#!/bin/bash

# Enable debug logging
export OLLAMA_DEBUG=1
export OLLAMA_HOST=0.0.0.0
export OLLAMA_ORIGINS=*

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Start Ollama server in the background
log "Starting Ollama server with host: $OLLAMA_HOST, port: $OLLAMA_PORT"
ollama serve &
OLLAMA_PID=$!

# Wait for the server to start and verify binding
log "Waiting for Ollama server to start..."
for i in {1..30}; do
    if curl -s http://0.0.0.0:11434/api/tags > /dev/null; then
        log "Ollama server is running and bound to all interfaces!"
        break
    fi
    if [ $i -eq 30 ]; then
        log "Failed to start Ollama server after 30 seconds"
        exit 1
    fi
    log "Waiting for Ollama server... ($i/30)"
    sleep 1
done

# Pull required models
log "Pulling required models..."
for model in "phi" "neural-chat"; do
    log "Pulling $model..."
    if ! ollama pull $model; then
        log "Failed to pull $model"
        exit 1
    fi
    log "Successfully pulled $model"
done

log "All models pulled successfully"

# Keep the container running and monitor the Ollama process
log "Monitoring Ollama process..."
while kill -0 $OLLAMA_PID 2>/dev/null; do
    # Check if the server is still responding
    if ! curl -s http://0.0.0.0:11434/api/tags > /dev/null; then
        log "Ollama server is not responding"
        exit 1
    fi
    sleep 1
done

log "Ollama server stopped unexpectedly"
exit 1 