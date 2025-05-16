# Ollama Documentation

## Installation

### macOS
- [Download for macOS](https://ollama.com/download)

### Windows
- [Download for Windows](https://ollama.com/download)

### Linux
```sh
curl -fsSL https://ollama.com/install.sh | sh
```
- [Manual install instructions](https://ollama.com/download)

### Docker
- The official Docker image: [`ollama/ollama`](https://hub.docker.com/r/ollama/ollama)

---

## Quickstart

To run and chat with Llama 3.2:
```sh
ollama run llama3.2
```

---

## Model Library

Ollama supports a list of models available on [ollama.com/library](https://ollama.com/library).

| Model         | Parameters | Size   | Download Command                |
|---------------|------------|--------|---------------------------------|
| Gemma 3       | 1B         | 815MB  | `ollama run gemma3:1b`          |
| Gemma 3       | 4B         | 3.3GB  | `ollama run gemma3`             |
| Llama 3.2     | 3B         | 2.0GB  | `ollama run llama3.2`           |
| Llama 3.2     | 1B         | 1.3GB  | `ollama run llama3.2:1b`        |
| Mistral       | 7B         | 4.1GB  | `ollama run mistral`            |
| ...           | ...        | ...    | ...                             |

> **Note:** You should have at least 8 GB of RAM for 7B models, 16 GB for 13B, and 32 GB for 33B models.

---

## Customizing a Model

### Import from GGUF
Create a `Modelfile`:
```Dockerfile
FROM ./vicuna-33b.Q4_0.gguf
```
Create the model:
```sh
ollama create example -f Modelfile
ollama run example
```

### Customize a Prompt
```Dockerfile
FROM llama3.2

PARAMETER temperature 1

SYSTEM """
You are Mario from Super Mario Bros. Answer as Mario, the assistant, only.
"""
```
Create and run the model:
```sh
ollama create mario -f ./Modelfile
ollama run mario
```

---

## CLI Reference

- **Create a model:**  
  `ollama create mymodel -f ./Modelfile`
- **Pull a model:**  
  `ollama pull llama3.2`
- **Remove a model:**  
  `ollama rm llama3.2`
- **Copy a model:**  
  `ollama cp llama3.2 my-model`
- **List models:**  
  `ollama list`
- **Show model info:**  
  `ollama show llama3.2`
- **Stop a model:**  
  `ollama stop llama3.2`

---

## REST API

Ollama has a REST API for running and managing models.

### Generate a Response

```sh
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2",
  "prompt": "Why is the sky blue?"
}'
```

### Chat with a Model

```sh
curl http://localhost:11434/api/chat -d '{
  "model": "llama3.2",
  "messages": [
    { "role": "user", "content": "why is the sky blue?" }
  ]
}'
```

> See the [API documentation](https://ollama.com/docs/api) for all endpoints.

---

## Start Ollama

To start the Ollama server:
```sh
ollama serve
```
In a separate shell, run a model:
```sh
ollama run llama3.2
```

---

## Community & Integrations

- [Discord](https://discord.gg/ollama)
- [Reddit](https://reddit.com/r/ollama)
- [Ollama Library](https://ollama.com/library)
- [API Docs](https://ollama.com/docs/api)