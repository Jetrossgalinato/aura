import math

from app.services.cleaning_service import clean_dataset


def _is_numeric(value: str) -> bool:
    normalized = value.strip()

    if not normalized:
        return False

    try:
        return math.isfinite(float(normalized))
    except ValueError:
        return False


def encode_categorical_dataset(
    headers: list[str],
    rows: list[list[str]],
) -> tuple[list[list[str]], list[dict[str, object]]]:
    column_count = len(headers)
    encoded_columns: list[dict[str, object]] = []
    categorical_by_column: dict[int, dict[str, int]] = {}

    for col_index in range(column_count):
        values = [row[col_index] for row in rows if col_index < len(row) and row[col_index] != ""]

        if not values:
            continue

        if not any(not _is_numeric(value) for value in values):
            continue

        mapping: dict[str, int] = {}

        for value in values:
            if value not in mapping:
                mapping[value] = len(mapping)

        categorical_by_column[col_index] = mapping
        encoded_columns.append(
            {
                "column_index": col_index,
                "header": headers[col_index] or f"Column {col_index + 1}",
                "mapping": mapping,
            },
        )

    encoded_rows: list[list[str]] = []

    for row in rows:
        next_row = [*row]

        for col_index, mapping in categorical_by_column.items():
            if col_index >= len(next_row):
                continue

            value = next_row[col_index]

            if value == "":
                continue

            encoded_value = mapping.get(value)

            if encoded_value is not None:
                next_row[col_index] = str(encoded_value)

        encoded_rows.append(next_row)

    return encoded_rows, encoded_columns


def prepare_categorical_preview(
    headers: list[str],
    rows: list[list[str]],
    max_rows: int | None = None,
) -> tuple[list[list[str]], list[dict[str, object]]]:
    cleaned_rows, _summary = clean_dataset(
        headers=headers,
        rows=rows,
        max_rows=max_rows,
    )

    return encode_categorical_dataset(headers, cleaned_rows)