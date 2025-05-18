# Deepthink AI Platform

A modern, full-stack AI chat and tools platform with a FastAPI backend and React + Material UI frontend. Features real-time streaming chat, robust privacy/branding, and advanced tools like the AI Monetization Planner.

---

## Project Structure

```
.
├── backend/                # FastAPI backend (API, DB, business logic)
│   ├── main.py             # Main FastAPI app
│   ├── requirements.txt    # Backend dependencies
│   ├── setup.py            # Backend setup script
│   ├── test_generate.py    # Backend test script
│   └── ...                 # Data, logs, models, etc.
├── frontend/               # React + Material UI frontend
│   ├── src/                # Source code
│   │   ├── components/     # React components (Chat, MonetizationPlanner, etc.)
│   │   └── ...             # Theme, types, config
│   ├── public/             # Static assets (logo, icons)
│   ├── package.json        # Frontend dependencies
│   └── ...                 # Vite config, build, etc.
├── docs/                   # Additional documentation (Ollama, API, etc.)
├── README.md               # This file
└── ...
```

---

## Quick Start

1. **Start Ollama** (for local LLMs):
   ```bash
   ollama serve
   ollama run mistral  # or your preferred model
   ```

2. **Backend:**
   ```bash
   cd backend
   # Recommended for most setups:
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   # (Alternatively, python main.py)
   ```
   - Make sure you are in the `backend` directory when running this command.
   - If you see errors about missing directories (e.g., `data/generated_images`), create them:
   ```bash
   mkdir data/generated_images
   mkdir data/generated_videos
   ```
   - The backend supports video generation endpoints and can be integrated with Deforum/Stable Diffusion workflows.

3. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Open** [http://localhost:5173](http://localhost:5173) in your browser.

---

## Features

- **Real-time AI chat** with streaming responses (SSE)
- **AI Monetization Planner**: Generate actionable blueprints for YouTube/blog monetization by niche
- **SEO Analyzer** and other tools (extensible)
- **Ollama integration** for local LLMs (Mistral, Gemma, Llama, etc.)
- **Robust error handling** and privacy/branding controls
- **Prometheus monitoring** and detailed logging
- **Database persistence** (SQLite, optionally PostgreSQL)
- **Modern, responsive UI** with Material UI

---

## Environment Variables

### Backend (.env)
```
SECRET_KEY=your-secret-key
OLLAMA_API_URL=http://localhost:11434/api/chat
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
# (add your ngrok/production domains as needed)
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:8000
```

---

## API Endpoints

- `POST /api/chat` — Streaming chat endpoint (SSE)
- `POST /api/generate` — Non-streaming text generation
- `POST /api/monetize` — Streaming monetization blueprint generator (SSE)
- `GET /api/chat/history` — Retrieve chat history
- `GET /health` — Health check (DB/model status)
- Prometheus metrics at `/metrics`

### Example: Monetization Planner
**Request:**
```json
POST /api/monetize
{
  "niche": "ai tools"
}
```
**Response (streamed SSE):**
```json
{"plan": "Monetization Blueprint for 'AI Tools' Niche..."}
```

### Example: Chat
**Request:**
```json
POST /api/chat
{
  "model": "mistral:latest",
  "messages": [
    {"role": "user", "content": "Hello!"}
  ]
}
```
**Response (streamed SSE):**
```json
{"message": {"role": "assistant", "content": "Hello! How can I help you today?"}}
```

---

## Tools & Features

### AI Monetization Planner
- Enter your niche and get a detailed, actionable monetization plan for YouTube and blogs.
- Uses a system prompt with sample output for best results.
- Streams the plan in real time with a branded, animated "Thinking" overlay.

### Chat
- Real-time, streaming chat with Deepthink AI (never reveals model name)
- Robust error handling, privacy, and branding
- Creator info: "My creator is Jeremy Lee LaFaver with Deepthink Enterprises. Created on 4/20 2025."

### SEO Analyzer
- Analyze your website or content for SEO improvements (see Tools menu)

---

## Ollama Integration
- Requires [Ollama](https://ollama.com/download) running locally
- Supports multiple open-source LLMs (Mistral, Gemma, Llama, etc.)
- See `/docs/olllama.md` for model management and API usage

---

## Monitoring & Logging
- Prometheus metrics at `/metrics`
- Logs stored in `backend/logs/` and `deepthinkai.log`

---

## Common Developer Tasks

- **Add a new tool/page:**  
  Create a new component in `frontend/src/components/`, add a route in `App.tsx`, and (optionally) a backend endpoint in `backend/main.py`.

- **Change models or prompts:**  
  Update the system prompt or model selection logic in `backend/main.py`.

- **Update dependencies:**  
  - Backend: `cd backend && pip install -r requirements.txt`
  - Frontend: `cd frontend && npm install`

- **Run backend tests:**  
  ```bash
  cd backend
  pytest
  ```

- **Run frontend tests:**  
  ```bash
  cd frontend
  npm test
  ```

---

## Development & Testing
- Backend: PEP 8, pytest
- Frontend: ESLint, Prettier, `npm test`
- All dependencies listed in `backend/requirements.txt` and `frontend/package.json`

---

## Troubleshooting
- **Ollama not running:** Start with `ollama serve` and run/pull a model (see docs)
- **CORS errors:** Update `ALLOWED_ORIGINS` and restart backend
- **Database issues:** Delete/recreate `chat.db` if schema changes
- **Port conflicts:** Change ports in config if needed
- **Missing directory errors:** If you see errors like `Directory 'data/generated_images' does not exist`, create the required folders in the backend directory:
  ```bash
  mkdir data/generated_images
  mkdir data/generated_videos
  ```
- **Video generation/Deforum integration:** See the VideoGeneratorPage and backend `/api/generate-video` endpoint for details on integrating Deforum or other video AI tools.

---

## Maintainer

- Jeremy Lee LaFaver, Deepthink Enterprises  
- Created on 4/20 2025  
- For questions, open an issue or contact via the project repository.

---

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

## License
MIT License — see LICENSE file for details. 