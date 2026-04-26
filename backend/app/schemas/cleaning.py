from pydantic import BaseModel, Field


class DatasetPayload(BaseModel):
    # Raw table payload sent by the frontend for cleaning preview.
    format: str = Field(default="CSV")
    headers: list[str] = Field(default_factory=list)
    rows: list[list[str]] = Field(default_factory=list)


class CleaningPreviewRequest(BaseModel):
    dataset: DatasetPayload
    # Optional cap for preview mode to avoid returning excessively large payloads.
    max_rows: int | None = Field(default=None, ge=1, le=5000)


class CleaningSummary(BaseModel):
    # Counts below are produced during cleaning to show what was normalized.
    processed_rows: int
    removed_empty_rows: int
    normalized_empty_cells: int
    trimmed_cells: int


class CleaningPreviewResponse(BaseModel):
    format: str
    headers: list[str]
    rows: list[list[str]]
    summary: CleaningSummary
