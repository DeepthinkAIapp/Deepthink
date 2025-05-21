#!/bin/bash

# Enable debug logging
export OLLAMA_DEBUG=1

# Start Ollama server in the background
echo "Starting Ollama server..."
ollama serve &
OLLAMA_PID=$!

# Wait for the server to start
echo "Waiting for Ollama server to start..."
for i in {1..30}; do
    if curl -s http://localhost:11434/api/tags > /dev/null; then
        echo "Ollama server is running!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "Failed to start Ollama server after 30 seconds"
        exit 1
    fi
    echo "Waiting for Ollama server... ($i/30)"
    sleep 1
done

# Pull required models
echo "Pulling required models..."
ollama pull mistral:latest
if [ $? -ne 0 ]; then
    echo "Failed to pull mistral:latest"
    exit 1
fi

ollama pull bakllava:latest
if [ $? -ne 0 ]; then
    echo "Failed to pull bakllava:latest"
    exit 1
fi

echo "All models pulled successfully"

# Keep the container running and monitor the Ollama process
while kill -0 $OLLAMA_PID 2>/dev/null; do
    sleep 1
done

echo "Ollama server stopped unexpectedly"
exit 1 