from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.schemas.cleaning import CleaningPreviewRequest, CleaningPreviewResponse
from app.services.cleaning_service import clean_dataset

app = FastAPI()

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


@app.post("/api/cleaning/preview", response_model=CleaningPreviewResponse)
def cleaning_preview(payload: CleaningPreviewRequest):
    cleaned_rows, summary = clean_dataset(
        headers=payload.dataset.headers,
        rows=payload.dataset.rows,
        max_rows=payload.max_rows,
    )

    return CleaningPreviewResponse(
        format=payload.dataset.format,
        headers=payload.dataset.headers,
        rows=cleaned_rows,
        summary=summary,
    )