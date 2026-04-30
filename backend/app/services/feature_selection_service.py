from app.schemas.feature_selection import FeatureSelectionSummary


def _validate_index(index: int, column_count: int, field_name: str):
    """
    Helper function to ensure requested column indices exist within the dataset bounds.
    Prevents IndexError exceptions during data projection.
    """
    if index < 0 or index >= column_count:
        raise ValueError(f"{field_name} contains out-of-range index: {index}")


def select_features(
    headers: list[str],
    rows: list[list[str]],
    feature_indices: list[int],
    target_index: int | None = None,
    max_rows: int | None = 100,
) -> tuple[list[str], list[str], str | None, list[list[str]], FeatureSelectionSummary]:
    """
    Filters the dataset columns to retain only the user-selected features and the target variable.
    Creates a tailored, smaller dataset specifically for the modeling phase or preview UI.
    
    Returns:
        A tuple containing:
        1. All selected headers combined (features + target).
        2. Only the feature headers.
        3. The target header (if provided).
        4. The projected rows containing only the selected columns (limited by max_rows).
        5. A FeatureSelectionSummary tracking the selection metrics.
    """
    column_count = len(headers)

    # 1. Input Validation
    if column_count == 0:
        raise ValueError("Dataset must include at least one header")

    for feature_index in feature_indices:
        _validate_index(feature_index, column_count, "feature_indices")

    if target_index is not None:
        _validate_index(target_index, column_count, "target_index")

    # 2. Build the ordered list of required column indices
    # We want to extract all selected features, and optionally the target variable.
    ordered_indices = list(feature_indices)
    target_header: str | None = None

    # Append the target index to our extraction list if it wasn't accidentally included in features
    if target_index is not None and target_index not in ordered_indices:
        ordered_indices.append(target_index)

    # 3. Extract matching headers
    selected_headers: list[str] = [headers[index] for index in ordered_indices]
    feature_headers: list[str] = [headers[index] for index in feature_indices]

    if target_index is not None:
        target_header = headers[target_index]

    # 4. Project the rows (Column Filtering)
    # Apply max_rows early so we don't spend compute projecting columns for rows we'll just throw away
    preview_rows_source = rows if max_rows is None else rows[:max_rows]
    selected_rows: list[list[str]] = []

    for row in preview_rows_source:
        # Safely extract values based on ordered_indices, padding with "" if the row is unexpectedly short
        projected_row = [row[index] if index < len(row) else "" for index in ordered_indices]
        selected_rows.append(projected_row)

    # 5. Compile summary metrics for the UI to display
    summary = FeatureSelectionSummary(
        total_columns=column_count,
        selected_feature_count=len(feature_indices),
        row_count=len(rows), # Total rows in the underlying dataset
        preview_row_count=len(selected_rows), # The number of rows actually returned in this preview
    )

    return selected_headers, feature_headers, target_header, selected_rows, summary