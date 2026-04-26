from app.schemas.cleaning import CleaningSummary


NA_VALUE = "N/A"


def _normalize_row_length(row: list[str], expected_length: int) -> list[str]:
    # Force each row to match header length by trimming extras or padding missing cells.
    if expected_length <= 0:
        return []

    normalized = row[:expected_length]

    if len(normalized) < expected_length:
        normalized.extend([""] * (expected_length - len(normalized)))

    return normalized


def clean_dataset(
    headers: list[str],
    rows: list[list[str]],
    max_rows: int | None = None,
) -> tuple[list[list[str]], CleaningSummary]:
    # The cleaning pass normalizes whitespace, converts empty cells to N/A,
    # drops fully empty rows, and tracks summary counters for the UI.
    expected_length = len(headers)
    cleaned_rows: list[list[str]] = []

    processed_rows = 0
    removed_empty_rows = 0
    normalized_empty_cells = 0
    trimmed_cells = 0

    for original_row in rows:
        normalized_row = _normalize_row_length(original_row, expected_length)
        processed_rows += 1

        cleaned_row: list[str] = []
        non_empty_cell_found = False

        for value in normalized_row:
            raw_value = value if isinstance(value, str) else str(value)
            stripped_value = raw_value.strip()

            if raw_value != stripped_value:
                trimmed_cells += 1

            if stripped_value == "":
                cleaned_row.append(NA_VALUE)
                normalized_empty_cells += 1
            else:
                cleaned_row.append(stripped_value)
                non_empty_cell_found = True

        if not non_empty_cell_found:
            # Rows with no remaining values are excluded from the cleaned preview.
            removed_empty_rows += 1
            continue

        cleaned_rows.append(cleaned_row)

        if max_rows and len(cleaned_rows) >= max_rows:
            break

    summary = CleaningSummary(
        processed_rows=processed_rows,
        removed_empty_rows=removed_empty_rows,
        normalized_empty_cells=normalized_empty_cells,
        trimmed_cells=trimmed_cells,
    )

    return cleaned_rows, summary
