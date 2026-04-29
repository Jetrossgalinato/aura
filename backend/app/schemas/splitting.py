from pydantic import BaseModel, Field


class DatasetPayload(BaseModel):
    # Raw table payload sent by the frontend for splitting.
    headers: list[str] = Field(default_factory=list)
    rows: list[list[str]] = Field(default_factory=list)


class SplittingRequest(BaseModel):
    # Request to split dataset into train and test sets.
    dataset: DatasetPayload
    test_size: float = Field(default=0.2, ge=0.01, le=0.99)
    random_state: int | None = Field(default=None)


class SplitSummary(BaseModel):
    # Statistics about the train-test split.
    total_rows: int
    train_rows: int
    test_rows: int
    train_percentage: float
    test_percentage: float


class SplittingResponse(BaseModel):
    # Response containing train and test datasets with split summary.
    train_set: dict
    test_set: dict
    summary: SplitSummary
