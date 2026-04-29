from fastapi import APIRouter

from app.schemas.splitting import SplittingRequest, SplittingResponse
from app.services.splitting_service import split_dataset

router = APIRouter()


@router.post("/splitting/split", response_model=SplittingResponse)
def split_data(payload: SplittingRequest):
    # Endpoint to split dataset into training and testing sets.
    train_set, test_set, summary = split_dataset(
        headers=payload.dataset.headers,
        rows=payload.dataset.rows,
        test_size=payload.test_size,
        random_state=payload.random_state,
    )

    return SplittingResponse(
        train_set=train_set,
        test_set=test_set,
        summary=summary,
    )
