from fastapi import APIRouter

from app.schemas.categorical import (
    CategoricalPreviewRequest,
    CategoricalPreviewResponse,
)
from app.services.categorical_service import prepare_categorical_preview

router = APIRouter()


@router.post("/categorical/preview", response_model=CategoricalPreviewResponse)
def categorical_preview(payload: CategoricalPreviewRequest):
    encoded_rows, encoded_columns = prepare_categorical_preview(
        headers=payload.dataset.headers,
        rows=payload.dataset.rows,
        max_rows=payload.max_rows,
    )

    return CategoricalPreviewResponse(
        format=payload.dataset.format,
        headers=payload.dataset.headers,
        rows=encoded_rows,
        encoded_columns=encoded_columns,
    )