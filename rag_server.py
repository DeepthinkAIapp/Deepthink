from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sentence_transformers import SentenceTransformer
import chromadb
import json
import os
from typing import List, Dict
import uvicorn

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the model and database
model = SentenceTransformer('all-MiniLM-L6-v2')
client = chromadb.Client()
collection = client.create_collection(name="knowledge_base")

# Load existing knowledge if available
KNOWLEDGE_FILE = "knowledge_base.json"
if os.path.exists(KNOWLEDGE_FILE):
    with open(KNOWLEDGE_FILE, 'r') as f:
        knowledge_base = json.load(f)
        # Add existing knowledge to ChromaDB
        for item in knowledge_base:
            collection.add(
                documents=[item["content"]],
                metadatas=[{"source": item["source"]}],
                ids=[str(len(collection.get()["ids"]) + 1)]
            )
else:
    knowledge_base = []

@app.post("/ingest")
async def ingest_knowledge(file: UploadFile = File(...)):
    try:
        content = await file.read()
        text = content.decode('utf-8')
        
        # Add to ChromaDB
        collection.add(
            documents=[text],
            metadatas=[{"source": file.filename}],
            ids=[str(len(collection.get()["ids"]) + 1)]
        )
        
        # Update knowledge base file
        knowledge_base.append({
            "content": text,
            "source": file.filename
        })
        
        with open(KNOWLEDGE_FILE, 'w') as f:
            json.dump(knowledge_base, f)
            
        return {"message": "Knowledge ingested successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search")
async def search_knowledge(query: str):
    try:
        # Search in ChromaDB
        results = collection.query(
            query_texts=[query],
            n_results=3
        )
        
        return {
            "results": [
                {
                    "content": doc,
                    "source": meta["source"]
                }
                for doc, meta in zip(results["documents"][0], results["metadatas"][0])
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001) 