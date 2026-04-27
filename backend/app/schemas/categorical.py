from pydantic import BaseModel, Field

from app.schemas.cleaning import DatasetPayload


class CategoricalColumnEncoding(BaseModel):
    column_index: int
    header: str
    mapping: dict[str, int]


class CategoricalPreviewRequest(BaseModel):
    dataset: DatasetPayload
    # Optional preview cap for large uploads.
    max_rows: int | None = Field(default=None, ge=1, le=5000)


class CategoricalPreviewResponse(BaseModel):
    format: str
    headers: list[str]
    rows: list[list[str]]
    encoded_columns: list[CategoricalColumnEncoding]