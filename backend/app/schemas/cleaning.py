from pydantic import BaseModel, Field


class DatasetPayload(BaseModel):
    format: str = Field(default="CSV")
    headers: list[str] = Field(default_factory=list)
    rows: list[list[str]] = Field(default_factory=list)


class CleaningPreviewRequest(BaseModel):
    dataset: DatasetPayload
    max_rows: int | None = Field(default=None, ge=1, le=5000)


class CleaningSummary(BaseModel):
    processed_rows: int
    removed_empty_rows: int
    normalized_empty_cells: int
    trimmed_cells: int


class CleaningPreviewResponse(BaseModel):
    format: str
    headers: list[str]
    rows: list[list[str]]
    summary: CleaningSummary
