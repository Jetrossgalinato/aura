from pydantic import BaseModel, Field, model_validator


class DatasetPayload(BaseModel):
    # Raw table payload sent by the frontend for feature selection.
    format: str = Field(default="CSV")
    headers: list[str] = Field(default_factory=list)
    rows: list[list[str]] = Field(default_factory=list)


class FeatureSelectionRequest(BaseModel):
    dataset: DatasetPayload
    feature_indices: list[int] = Field(default_factory=list)
    target_index: int | None = Field(default=None, ge=0)
    max_rows: int | None = Field(default=100, ge=1, le=5000)

    @model_validator(mode="after")
    def validate_selection(self):
        if not self.feature_indices:
            raise ValueError("feature_indices must include at least one column")

        deduped = list(dict.fromkeys(self.feature_indices))
        if len(deduped) != len(self.feature_indices):
            raise ValueError("feature_indices must not contain duplicate values")

        self.feature_indices = deduped
        return self


class FeatureSelectionSummary(BaseModel):
    total_columns: int
    selected_feature_count: int
    row_count: int
    preview_row_count: int


class FeatureSelectionResponse(BaseModel):
    format: str
    selected_headers: list[str]
    feature_headers: list[str]
    target_header: str | None
    rows: list[list[str]]
    summary: FeatureSelectionSummary
