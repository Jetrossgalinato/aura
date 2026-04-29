from app.schemas.feature_selection import FeatureSelectionSummary


def _validate_index(index: int, column_count: int, field_name: str):
    if index < 0 or index >= column_count:
        raise ValueError(f"{field_name} contains out-of-range index: {index}")


def select_features(
    headers: list[str],
    rows: list[list[str]],
    feature_indices: list[int],
    target_index: int | None = None,
    max_rows: int | None = 100,
) -> tuple[list[str], list[str], str | None, list[list[str]], FeatureSelectionSummary]:
    column_count = len(headers)

    if column_count == 0:
        raise ValueError("Dataset must include at least one header")

    for feature_index in feature_indices:
        _validate_index(feature_index, column_count, "feature_indices")

    if target_index is not None:
        _validate_index(target_index, column_count, "target_index")

    ordered_indices = list(feature_indices)
    target_header: str | None = None

    if target_index is not None and target_index not in ordered_indices:
        ordered_indices.append(target_index)

    selected_headers: list[str] = [headers[index] for index in ordered_indices]
    feature_headers: list[str] = [headers[index] for index in feature_indices]

    if target_index is not None:
        target_header = headers[target_index]

    preview_rows_source = rows if max_rows is None else rows[:max_rows]
    selected_rows: list[list[str]] = []

    for row in preview_rows_source:
        projected_row = [row[index] if index < len(row) else "" for index in ordered_indices]
        selected_rows.append(projected_row)

    summary = FeatureSelectionSummary(
        total_columns=column_count,
        selected_feature_count=len(feature_indices),
        row_count=len(rows),
        preview_row_count=len(selected_rows),
    )

    return selected_headers, feature_headers, target_header, selected_rows, summary
