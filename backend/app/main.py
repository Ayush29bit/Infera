from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import health, upload, rag, auth


app = FastAPI(title="Smart Compliance Assistant - Backend")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(rag.router, prefix="/api", tags=["rag"])
app.include_router(auth.router, prefix="/api", tags=["auth"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the Smart Compliance Assistant Backend!"}