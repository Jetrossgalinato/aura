import math

from app.services.cleaning_service import NA_VALUE, clean_dataset


def _is_numeric(value: str) -> bool:
    """
    Determines if a given string value can be safely converted to a finite float.
    Ignores predefined NA values and empty strings.
    """
    if value == NA_VALUE:
        return False

    normalized = value.strip()

    if not normalized:
        return False

    try:
        # Check if the float conversion succeeds and is a finite number (e.g., not 'inf')
        return math.isfinite(float(normalized))
    except ValueError:
        return False


def encode_categorical_dataset(
    headers: list[str],
    rows: list[list[str]],
) -> tuple[list[list[str]], list[dict[str, object]]]:
    """
    Scans a dataset for categorical (non-numeric) columns and converts those 
    text values into integer-based labels (Label Encoding).
    
    Returns:
        A tuple containing:
        1. The transformed dataset (rows with categorical strings replaced by integer strings).
        2. A metadata list detailing which columns were encoded and their corresponding label mappings.
    """
    column_count = len(headers)
    encoded_columns: list[dict[str, object]] = []
    
    # Stores the mapping dictionary for each column index that needs encoding
    categorical_by_column: dict[int, dict[str, int]] = {}

    # Step 1: Analyze columns to find categorical data and build the mappings
    for col_index in range(column_count):
        # Extract all valid (non-empty, non-NA) values for the current column
        values = [
            row[col_index]
            for row in rows
            if col_index < len(row)
            and row[col_index] != ""
            and row[col_index] != NA_VALUE
        ]

        if not values:
            continue

        # If every value in the column is numeric, skip encoding
        if not any(not _is_numeric(value) for value in values):
            continue

        mapping: dict[str, int] = {}

        # Generate a unique integer ID for every unique string category
        for value in values:
            if value == NA_VALUE:
                continue

            if value not in mapping:
                mapping[value] = len(mapping)

        # Store mapping for application to the rows later
        categorical_by_column[col_index] = mapping
        
        # Save metadata about the encoding process for potential UI display or inverse transforms
        encoded_columns.append(
            {
                "column_index": col_index,
                "header": headers[col_index] or f"Column {col_index + 1}",
                "mapping": mapping,
            },
        )

    # Step 2: Apply the generated mappings to the dataset
    encoded_rows: list[list[str]] = []

    for row in rows:
        next_row = [*row]  # Create a shallow copy to avoid mutating the original dataset directly

        for col_index, mapping in categorical_by_column.items():
            if col_index >= len(next_row):
                continue

            value = next_row[col_index]

            # Preserve empty and NA values during the encoding process
            if value == "" or value == NA_VALUE:
                continue

            encoded_value = mapping.get(value)

            # Replace the string category with its corresponding stringified integer ID
            if encoded_value is not None:
                next_row[col_index] = str(encoded_value)

        encoded_rows.append(next_row)

    return encoded_rows, encoded_columns


def prepare_categorical_preview(
    headers: list[str],
    rows: list[list[str]],
    max_rows: int | None = None,
) -> tuple[list[list[str]], list[dict[str, object]]]:
    """
    Cleans the raw dataset and applies categorical encoding to generate a preview.
    Useful for displaying a sample of how the data will look after transformation.
    """
    # Standardize missing values and apply basic cleaning constraints up to max_rows
    cleaned_rows, _summary = clean_dataset(
        headers=headers,
        rows=rows,
        max_rows=max_rows,
    )

    # Pass the cleaned data into the encoding pipeline
    return encode_categorical_dataset(headers, cleaned_rows)