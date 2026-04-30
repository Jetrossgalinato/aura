from pydantic import BaseModel, Field


class DatasetPayload(BaseModel):
    format: str = Field(default="CSV")
    headers: list[str] = Field(default_factory=list)
    rows: list[list[str]] = Field(default_factory=list)


class RegressionTrainingRequest(BaseModel):
    dataset: DatasetPayload
    feature_indices: list[int] = Field(default_factory=list)
    target_index: int = Field(default=0, ge=0)
    test_size: float = Field(default=0.2, ge=0.01, le=0.99)
    random_state: int | None = Field(default=42)


class RegressionMetrics(BaseModel):
    mean_absolute_error: float
    mean_squared_error: float
    root_mean_squared_error: float
    r2_score: float
    evaluation_rows: int


class RegressionResponse(BaseModel):
    format: str
    selected_headers: list[str]
    target_header: str
    summary: dict
    metrics: RegressionMetrics
    prediction_preview: list[dict[str, str]]
