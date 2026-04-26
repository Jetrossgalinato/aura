from fastapi import APIRouter

from app.schemas.cleaning import CleaningPreviewRequest, CleaningPreviewResponse
from app.services.cleaning_service import clean_dataset

router = APIRouter()


@router.post("/cleaning/preview", response_model=CleaningPreviewResponse)
def cleaning_preview(payload: CleaningPreviewRequest):
    # Stateless preview endpoint so frontend can request cleaned table data on demand.
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