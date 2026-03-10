from fastapi import FastAPI
from pymongo import MongoClient
from pydantic import BaseModel
from typing import List, Union


class RGB(BaseModel):
    r: int
    g: int
    b: int


class ConstructionItem(BaseModel):
    x: int
    y: int
    # cor pode ser um código rgb565 (string) ou um objeto RGB com componentes 0‑255
    color: Union[str, RGB]
from datetime import datetime

app = FastAPI()

# Configurar CORS para permitir chamadas do dashboard hospedado pelo Codespaces
from fastapi.middleware.cors import CORSMiddleware

origins = [
    "https://verbose-bassoon-66q44wx4gxgh5rw7-3000.app.github.dev",
    "https://verbose-bassoon-66q44wx4gxgh5rw7-8000.app.github.dev",
    "http://localhost:3000",
    "http://localhost:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Conexão com MongoDB
import os
mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017/")
client = MongoClient(mongo_url)
db = client["holocraft"]
live_collection = db["live_constructions"]
saved_collection = db["saved_constructions"]

@app.get("/api/dados")
def get_dados():
    return {"message": "Api Funcionando!"}

@app.get("/api/constructions/live")
def get_live_construction():
    try:
        # Buscar a construção live (assumindo um documento único ou o mais recente)
        doc = live_collection.find_one(sort=[("timestamp", -1)])
        if doc:
            return doc["items"]
        else:
            return []
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/constructions/live")
def update_live_construction(items: List[ConstructionItem]):
    # Sobrescrever a construção live (remover anteriores e inserir nova)
    live_collection.delete_many({}) 
    doc = {
        "items": [item.dict() for item in items],
        "timestamp": datetime.utcnow()
    }
    live_collection.insert_one(doc)
    return {"message": "Construção live atualizada"}

@app.post("/api/constructions")
def save_construction(items: List[ConstructionItem]):
    doc = {
        "items": [item.dict() for item in items],
        "timestamp": datetime.utcnow()
    }
    saved_collection.insert_one(doc)
    return {"message": "Construção salva"}

@app.get("/api/constructions")
def get_saved_constructions():
    try:
        # Buscar todas as construções salvas, ordenadas por timestamp descendente
        docs = list(saved_collection.find(sort=[("timestamp", -1)]))
        return [{"id": str(doc["_id"]), "items": doc["items"], "timestamp": doc["timestamp"]} for doc in docs]
    except Exception as e:
        return {"error": str(e)}
