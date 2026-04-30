from pydantic import BaseModel, Field, model_validator


class DatasetPayload(BaseModel):
    # Raw table payload sent by the frontend for model training.
    format: str = Field(default="CSV")
    headers: list[str] = Field(default_factory=list)
    rows: list[list[str]] = Field(default_factory=list)


class ModelTrainingRequest(BaseModel):
    dataset: DatasetPayload
    feature_indices: list[int] = Field(default_factory=list)
    target_index: int = Field(default=0, ge=0)
    test_size: float = Field(default=0.2, ge=0.01, le=0.99)
    random_state: int | None = Field(default=42)
    target_binning_strategy: str = Field(default="auto")

    @model_validator(mode="after")
    def validate_selection(self):
        if not self.feature_indices:
            raise ValueError("feature_indices must include at least one column")

        if len(set(self.feature_indices)) != len(self.feature_indices):
            raise ValueError("feature_indices must not contain duplicate values")

        if self.target_index in self.feature_indices:
            raise ValueError("target_index must not be included in feature_indices")

        allowed_binning_strategies = {"auto", "median", "tertile", "quartile"}
        if self.target_binning_strategy not in allowed_binning_strategies:
            raise ValueError(
                "target_binning_strategy must be one of: auto, median, tertile, quartile",
            )

        return self


class ModelMetrics(BaseModel):
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    confusion_matrix: list[list[int]]
    train_rows: int
    test_rows: int


class ModelTrainingResult(BaseModel):
    model_name: str
    metrics: ModelMetrics
    prediction_preview: list[dict[str, str]]
    rank: int = Field(default=0, ge=0)
    is_best_model: bool = Field(default=False)


class ModelTrainingSummary(BaseModel):
    total_rows: int
    feature_count: int
    target_header: str
    target_binning_strategy: str | None = None
    test_size: float
    best_model_name: str
    best_accuracy: float


class ModelTrainingResponse(BaseModel):
    format: str
    selected_headers: list[str]
    target_header: str
    summary: ModelTrainingSummary
    results: list[ModelTrainingResult]
