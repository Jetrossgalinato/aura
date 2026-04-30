from __future__ import annotations

import math
from typing import List

import numpy as np
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


def _coerce_value(value: str):
    if value is None:
        return np.nan

    s = str(value).strip()
    if s == "" or s.upper() == "N/A":
        return np.nan

    try:
        return float(s)
    except ValueError:
        return s


def _prepare_rows(rows: List[List[str]], indices: List[int]) -> List[List[str]]:
    projected = []
    for row in rows:
        projected.append([row[i] if i < len(row) else "" for i in indices])
    return projected


def _prepare_feature_rows(
    rows: List[List[str]],
    numeric_indices: List[int],
    categorical_indices: List[int],
) -> List[List[object]]:
    prepared_rows: List[List[object]] = []
    numeric_set = set(numeric_indices)
    categorical_set = set(categorical_indices)

    for row in rows:
        prepared_row: List[object] = []

        for column_index in range(len(row)):
            cell = row[column_index] if column_index < len(row) else ""

            if column_index in numeric_set:
                prepared_row.append(_coerce_value(cell))
            elif column_index in categorical_set:
                prepared_row.append(cell)

        prepared_rows.append(prepared_row)

    return prepared_rows


def _is_column_numeric(col_values: List[str]) -> bool:
    # consider numeric if majority of non-empty values coerce to float
    numeric_count = 0
    total_count = 0
    for v in col_values:
        c = _coerce_value(v)
        if isinstance(c, float) or isinstance(c, int) or (isinstance(c, np.floating) and not np.isnan(c)):
            numeric_count += 1
        if not (isinstance(c, float) and np.isnan(c)):
            total_count += 1

    if total_count == 0:
        return False
    return (numeric_count / total_count) >= 0.6


def train_regression_from_notebook(headers: List[str], rows: List[List[str]], feature_indices: List[int], target_index: int, test_size: float = 0.2, random_state: int | None = 42):
    """Train a RandomForest regression with notebook-like preprocessing.

    Returns a dict with summary, metrics, and prediction preview.
    """
    if not headers:
        raise ValueError("No headers provided")

    for idx in feature_indices:
        if idx < 0 or idx >= len(headers):
            raise ValueError("feature_indices contains out-of-range index")

    if target_index < 0 or target_index >= len(headers):
        raise ValueError("target_index out of range")

    if target_index in feature_indices:
        raise ValueError("target_index must not overlap selected features")

    selected_headers = [headers[i] for i in feature_indices]
    feature_rows = _prepare_rows(rows, feature_indices)
    target_vals_raw = [row[target_index] if target_index < len(row) else "" for row in rows]

    # coerce target to numeric
    y = []
    for i, v in enumerate(target_vals_raw):
        c = _coerce_value(v)
        if isinstance(c, str) or (isinstance(c, float) and np.isnan(c)):
            raise ValueError(f"Target column must be numeric on row {i + 1}")
        y.append(float(c))

    if not feature_rows:
        raise ValueError("No feature rows available")

    column_total = len(feature_rows[0])

    # determine numeric vs categorical for each selected column
    numeric_indices = []
    categorical_indices = []
    for col in range(column_total):
        col_vals = [row[col] for row in feature_rows]
        if _is_column_numeric(col_vals):
            numeric_indices.append(col)
        else:
            categorical_indices.append(col)

    X = np.array(
        _prepare_feature_rows(feature_rows, numeric_indices, categorical_indices),
        dtype=object,
    )

    transformers = []
    if numeric_indices:
        transformers.append(
            ("num", Pipeline([("imputer", SimpleImputer(strategy="median")), ("scaler", StandardScaler())]), numeric_indices)
        )

    if categorical_indices:
        transformers.append(
            ("cat", Pipeline([("imputer", SimpleImputer(strategy="most_frequent")), ("onehot", OneHotEncoder(handle_unknown="ignore"))]), categorical_indices)
        )

    preprocessor = ColumnTransformer(transformers=transformers, remainder="drop")

    model = Pipeline([
        ("preprocessor", preprocessor),
        ("regressor", RandomForestRegressor(n_estimators=500, max_depth=20, min_samples_split=5, random_state=42)),
    ])

    X_train, X_test, y_train, y_test = train_test_split(X, np.array(y, dtype=float), test_size=test_size, random_state=random_state)

    model.fit(X_train, y_train)
    preds = model.predict(X_test)

    mae = float(mean_absolute_error(y_test, preds))
    mse = float(mean_squared_error(y_test, preds))
    rmse = math.sqrt(mse)
    r2 = float(r2_score(y_test, preds))

    preview = []
    for i in range(min(5, len(y_test))):
        preview.append({"actual": f"{float(y_test[i]):.4f}", "predicted": f"{float(preds[i]):.4f}"})

    return {
        "format": "CSV",
        "selected_headers": selected_headers,
        "target_header": headers[target_index],
        "summary": {
            "total_rows": len(rows),
            "feature_count": len(feature_indices),
            "target_header": headers[target_index],
            "test_size": test_size,
            "model_name": type(model.named_steps["regressor"]).__name__,
        },
        "metrics": {
            "mean_absolute_error": round(mae, 4),
            "mean_squared_error": round(mse, 4),
            "root_mean_squared_error": round(rmse, 4),
            "r2_score": round(r2, 4),
            "evaluation_rows": len(X_test),
        },
        "prediction_preview": preview,
    }
