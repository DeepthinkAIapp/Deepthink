import chromadb
from sentence_transformers import SentenceTransformer
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or ["http://localhost:5173"] for more security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = SentenceTransformer('all-MiniLM-L6-v2')
chroma_client = chromadb.Client()
collection = chroma_client.create_collection("knowledge")

KB_PATH = "knowledge_base.json"

# Ensure knowledge base file exists
if not os.path.exists(KB_PATH):
    with open(KB_PATH, "w", encoding="utf-8") as f:
        json.dump([], f)

# Load and index knowledge base
with open(KB_PATH, "r", encoding="utf-8") as f:
    kb = json.load(f)
for i, doc in enumerate(kb):
    collection.add(
        documents=[doc["content"]],
        metadatas=[{"title": doc["title"], "source": doc.get("source", "user")}],
        ids=[str(i)]
    )

@app.get("/search")
def search(q: str = Query(...)):
    results = collection.query(query_texts=[q], n_results=3)
    return results

class IngestRequest(BaseModel):
    title: str
    content: str
    source: str = "user"

@app.post("/ingest")
def ingest(data: IngestRequest):
    # Append to knowledge_base.json
    with open(KB_PATH, "r+", encoding="utf-8") as f:
        kb = json.load(f)
        kb.append(data.dict())
        f.seek(0)
        json.dump(kb, f, ensure_ascii=False, indent=2)
    # Add to ChromaDB
    collection.add(
        documents=[data.content],
        metadatas=[{"title": data.title, "source": data.source}],
        ids=[str(len(kb)-1)]
    )
    return {"status": "success"} 