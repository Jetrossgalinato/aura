from app.schemas.cleaning import CleaningSummary


# Constant used to represent missing or empty data across the application
NA_VALUE = "N/A"


def _normalize_row_length(row: list[str], expected_length: int) -> list[str]:
    """
    Ensures a given row matches the exact length of the dataset headers.
    Trims excess columns if the row is too long, and pads with empty strings if it's too short.
    """
    if expected_length <= 0:
        return []

    # Trim any extra columns that exceed the header count
    normalized = row[:expected_length]

    # Pad with empty strings if the row has fewer columns than the header
    if len(normalized) < expected_length:
        normalized.extend([""] * (expected_length - len(normalized)))

    return normalized


def clean_dataset(
    headers: list[str],
    rows: list[list[str]],
    max_rows: int | None = None,
) -> tuple[list[list[str]], CleaningSummary]:
    """
    A foundational data cleaning pipeline that sanitizes raw input rows.
    
    Operations performed:
    1. Row length normalization (matching header length).
    2. Whitespace trimming for all string values.
    3. Null imputation (replacing empty cells with a standard NA_VALUE).
    4. Row filtering (dropping completely empty rows).
    
    Returns:
        A tuple containing the cleaned rows and a CleaningSummary tracking the applied operations.
    """
    expected_length = len(headers)
    cleaned_rows: list[list[str]] = []

    # Counters to populate the CleaningSummary metrics for UI feedback
    processed_rows = 0
    removed_empty_rows = 0
    normalized_empty_cells = 0
    trimmed_cells = 0

    for original_row in rows:
        # 1. Ensure the row length strictly matches the header length
        normalized_row = _normalize_row_length(original_row, expected_length)
        processed_rows += 1

        cleaned_row: list[str] = []
        non_empty_cell_found = False

        for value in normalized_row:
            # Coerce to string safely to handle potential unexpected types in raw data
            raw_value = value if isinstance(value, str) else str(value)
            
            # 2. Trim leading/trailing whitespace
            stripped_value = raw_value.strip()

            if raw_value != stripped_value:
                trimmed_cells += 1

            # 3. Standardize empty cells to NA_VALUE
            if stripped_value == "":
                cleaned_row.append(NA_VALUE)
                normalized_empty_cells += 1
            else:
                cleaned_row.append(stripped_value)
                non_empty_cell_found = True

        # 4. Drop the row entirely if it contains absolutely no valid data
        if not non_empty_cell_found:
            removed_empty_rows += 1
            continue

        cleaned_rows.append(cleaned_row)

        # Early exit if we only need a limited preview (saves processing time on massive files)
        if max_rows and len(cleaned_rows) >= max_rows:
            break

    # Compile the telemetry metrics of the cleaning job
    summary = CleaningSummary(
        processed_rows=processed_rows,
        removed_empty_rows=removed_empty_rows,
        normalized_empty_cells=normalized_empty_cells,
        trimmed_cells=trimmed_cells,
    )

    return cleaned_rows, summary