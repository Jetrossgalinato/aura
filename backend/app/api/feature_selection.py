from fastapi import APIRouter, HTTPException

from app.schemas.feature_selection import (
    FeatureSelectionRequest,
    FeatureSelectionResponse,
)
from app.services.feature_selection_service import select_features

router = APIRouter()


@router.post("/feature-selection/preview", response_model=FeatureSelectionResponse)
def feature_selection_preview(payload: FeatureSelectionRequest):
    try:
        selected_headers, feature_headers, target_header, rows, summary = select_features(
            headers=payload.dataset.headers,
            rows=payload.dataset.rows,
            feature_indices=payload.feature_indices,
            target_index=payload.target_index,
            max_rows=payload.max_rows,
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    return FeatureSelectionResponse(
        format=payload.dataset.format,
        selected_headers=selected_headers,
        feature_headers=feature_headers,
        target_header=target_header,
        rows=rows,
        summary=summary,
    )
