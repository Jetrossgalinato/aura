from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.categorical import router as categorical_router
from app.api.cleaning import router as cleaning_router
from app.api.splitting import router as splitting_router

app = FastAPI()

# Allow local frontend during development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def hello_world():
    return {"message": "Hello, World!"}

app.include_router(cleaning_router, prefix="/api")
app.include_router(categorical_router, prefix="/api")
app.include_router(splitting_router, prefix="/api")