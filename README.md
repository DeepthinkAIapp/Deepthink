# DeepThink AI

[![Deployed on Vercel](https://vercel.com/button)](https://deepthinkai.app)

## Overview
DeepThink AI is a full-stack AI-powered platform for SEO, content, and digital growth. The backend is deployed on [Render](https://render.com/) and the frontend is deployed on [Vercel](https://vercel.com/) at [https://deepthinkai.app](https://deepthinkai.app).

---

## Production Deployment

### Backend (API)
- **Platform:** [Render](https://render.com/)
- **URL:** https://deepthinkapp.onrender.com
- **Environment Variables:** Set in the Render dashboard (not in `.env` for production)
  - `OLLAMA_API_URL` (cloud or internal URL)
  - `SD_WEBUI_URL` (cloud or internal URL)
  - `SECRET_KEY`, `MAX_CONNECTIONS`, etc. as needed
- **Note:** Backend does **not** need to be run locally for production use.

### Frontend (Web App)
- **Platform:** [Vercel](https://vercel.com/)
- **URL:** https://deepthinkai.app
- **API Connection:** All API calls are routed to the Render backend via the deployed domain.
- **Configuration:**
  - `frontend/src/config.ts` uses `https://deepthinkapp.onrender.com` as the API base URL.
  - `vercel.json` rewrites `/api/*` to the Render backend.

---

## Local Development

### Backend
- You can still run the backend locally for development:
  1. Clone the repo
  2. Set up a `.env` file with your local or test environment variables
  3. Run: `uvicorn main:app --reload --host 0.0.0.0 --port 8000`
- For production, **do not** run the backend locally. Use the Render deployment.

### Frontend
- You can run the frontend locally with Vite:
  1. `cd frontend`
  2. `npm install`
  3. `npm run dev`
- For local API testing, update `frontend/src/config.ts` to use your local backend, or use the deployed Render backend for production-like testing.

---

## Environment Variables
- **Production:** Set in Render and Vercel dashboards.
- **Local:** Use a `.env` file for backend, and `.env.local` for frontend if needed.

---

## Connecting Frontend and Backend
- All production API calls from the frontend at `deepthinkai.app` are routed to the backend at `https://deepthinkapp.onrender.com`.
- CORS and allowed origins are configured to allow requests from `https://deepthinkai.app`.

---

## Troubleshooting
- If you see `Failed to fetch` errors, ensure your frontend is using the correct API URL and your backend is running on Render.
- If logos or images do not appear, ensure they are in the correct `public` directory and referenced with the correct path.

---

## Contact & Support
For questions or support, open an issue or contact the maintainer.

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
```-


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