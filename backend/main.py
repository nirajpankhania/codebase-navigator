from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.chat import router as chat_router
from routes.ingest import router as ingest_router
from routes.status import router as status_router

app = FastAPI(title="Codebase Navigator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingest_router, prefix="/api")
app.include_router(chat_router, prefix="/api")
app.include_router(status_router, prefix="/api")


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
