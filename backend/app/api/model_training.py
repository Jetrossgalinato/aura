from fastapi import APIRouter, HTTPException

from app.schemas.model_training import ModelTrainingRequest, ModelTrainingResponse
from app.services.model_training_service import train_models

router = APIRouter()


@router.post("/model-training/preview", response_model=ModelTrainingResponse)
def model_training_preview(payload: ModelTrainingRequest):
    try:
        selected_headers, target_header, summary, results = train_models(
            headers=payload.dataset.headers,
            rows=payload.dataset.rows,
            feature_indices=payload.feature_indices,
            target_index=payload.target_index,
            test_size=payload.test_size,
            random_state=payload.random_state,
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    return ModelTrainingResponse(
        format=payload.dataset.format,
        selected_headers=selected_headers,
        target_header=target_header,
        summary=summary,
        results=results,
    )
