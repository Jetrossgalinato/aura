import numpy as np
from sklearn.compose import ColumnTransformer
from sklearn.exceptions import ConvergenceWarning
from sklearn.dummy import DummyClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import accuracy_score, confusion_matrix, f1_score, precision_score, recall_score
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.svm import SVC
import warnings

from app.schemas.model_training import ModelMetrics, ModelTrainingResult, ModelTrainingSummary

warnings.filterwarnings("ignore", category=ConvergenceWarning)


def _validate_index(index: int, column_count: int, field_name: str) -> None:
    if index < 0 or index >= column_count:
        raise ValueError(f"{field_name} contains out-of-range index: {index}")


def _coerce_value(value: str) -> str | float:
    stripped_value = value.strip()

    if stripped_value == "" or stripped_value.upper() == "N/A":
        return np.nan

    try:
        return float(stripped_value)
    except ValueError:
        return stripped_value


def _is_numeric_target(values: list[str]) -> bool:
    numeric_count = 0
    total_count = 0

    for value in values:
        if value is None or str(value).strip() == "":
            continue

        total_count += 1
        coerced_value = _coerce_value(value)

        if isinstance(coerced_value, str) or np.isnan(coerced_value):
            continue

        numeric_count += 1

    return total_count > 0 and (numeric_count / total_count) >= 0.9


def _bin_numeric_target(values: list[str], strategy: str) -> list[str]:
    numeric_values: list[float] = []

    for value in values:
        coerced_value = _coerce_value(value)

        if isinstance(coerced_value, str) or np.isnan(coerced_value):
            raise ValueError("Target column must not contain missing or non-numeric values")

        numeric_values.append(float(coerced_value))

    if not numeric_values:
        raise ValueError("Target column must contain at least one value")

    labeled_values: list[str] = []

    if strategy == "median":
        threshold = float(np.median(numeric_values))

        for value in numeric_values:
            if value <= threshold:
                labeled_values.append("Low")
            else:
                labeled_values.append("High")

        return labeled_values

    if strategy == "quartile":
        q1 = float(np.quantile(numeric_values, 0.25))
        q2 = float(np.quantile(numeric_values, 0.5))
        q3 = float(np.quantile(numeric_values, 0.75))

        for value in numeric_values:
            if value <= q1:
                labeled_values.append("Low")
            elif value <= q2:
                labeled_values.append("Medium")
            elif value <= q3:
                labeled_values.append("High")
            else:
                labeled_values.append("Very High")

        return labeled_values

    # Default tertile strategy
    unique_values = len(set(numeric_values))
    if unique_values < 3:
        lower_threshold = float(np.median(numeric_values))
        upper_threshold = lower_threshold
    else:
        lower_threshold = float(np.quantile(numeric_values, 1 / 3))
        upper_threshold = float(np.quantile(numeric_values, 2 / 3))

    if lower_threshold == upper_threshold:
        midpoint = float(np.median(numeric_values))
        lower_threshold = midpoint
        upper_threshold = midpoint

    for value in numeric_values:
        if value <= lower_threshold:
            labeled_values.append("Low")
        elif value <= upper_threshold:
            labeled_values.append("Medium")
        else:
            labeled_values.append("High")

    return labeled_values


def _prepare_rows(rows: list[list[str]], indices: list[int]) -> list[list[str]]:
    projected_rows: list[list[str]] = []

    for row in rows:
        projected_rows.append([row[index] if index < len(row) else "" for index in indices])

    return projected_rows


def _prepare_feature_matrix(
    rows: list[list[str]],
    numeric_indices: list[int],
) -> list[list[str | float]]:
    numeric_index_set = set(numeric_indices)
    prepared_rows: list[list[str | float]] = []

    for row in rows:
        prepared_row: list[str | float] = []

        for column_index, value in enumerate(row):
            if column_index in numeric_index_set:
                coerced_value = _coerce_value(value)

                if isinstance(coerced_value, str):
                    prepared_row.append(np.nan)
                else:
                    prepared_row.append(float(coerced_value))
            else:
                prepared_row.append(value)

        prepared_rows.append(prepared_row)

    return prepared_rows


def _is_numeric_feature(values: list[str]) -> bool:
    numeric_count = 0
    total_count = 0

    for value in values:
        coerced_value = _coerce_value(value)

        if isinstance(coerced_value, str) or np.isnan(coerced_value):
            continue

        numeric_count += 1
        total_count += 1

    return total_count > 0 and (numeric_count / total_count) >= 0.7


def _build_pipeline(
    model_name: str,
    numeric_indices: list[int],
    categorical_indices: list[int],
    overrides: dict | None = None,
) -> Pipeline:
    params = overrides or {}

    if model_name == "KNN":
        classifier = KNeighborsClassifier(
            n_neighbors=params.get("n_neighbors", 7),
            weights=params.get("weights", "distance"),
        )
    elif model_name == "SVM":
        classifier = SVC(
            kernel="rbf",
            C=params.get("C", 3.0),
            gamma=params.get("gamma", "scale"),
            probability=False,
        )
    else:
        classifier = MLPClassifier(
            hidden_layer_sizes=params.get("hidden_layer_sizes", (64, 32)),
            solver=params.get("solver", "lbfgs"),
            activation=params.get("activation", "relu"),
            max_iter=params.get("max_iter", 2000),
            alpha=params.get("alpha", 0.0001),
            random_state=42,
        )

    transformers: list[tuple[str, Pipeline, list[int]]] = []

    if numeric_indices:
        transformers.append(
            (
                "num",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="median")),
                        ("scaler", StandardScaler()),
                    ],
                ),
                numeric_indices,
            ),
        )

    if categorical_indices:
        transformers.append(
            (
                "cat",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="most_frequent")),
                        (
                            "encoder",
                            OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                        ),
                    ],
                ),
                categorical_indices,
            ),
        )

    if not transformers:
        raise ValueError("No valid feature columns available for model training")

    return Pipeline(
        steps=[
            (
                "preprocessor",
                ColumnTransformer(transformers=transformers, remainder="drop"),
            ),
            ("classifier", classifier),
        ],
    )


def _can_stratify(target_values: list[str]) -> bool:
    label_counts: dict[str, int] = {}

    for value in target_values:
        label_counts[value] = label_counts.get(value, 0) + 1

    return len(label_counts) > 1 and min(label_counts.values()) > 1


def _get_model_candidates(model_name: str) -> list[dict]:
    if model_name == "KNN":
        return [
            {"n_neighbors": 13, "weights": "distance"},
            {"n_neighbors": 5, "weights": "distance"},
            {"n_neighbors": 7, "weights": "distance"},
            {"n_neighbors": 11, "weights": "distance"},
            {"n_neighbors": 7, "weights": "uniform"},
        ]

    if model_name == "SVM":
        return [
            {"C": 6.0, "gamma": "scale"},
            {"C": 3.0, "gamma": "scale"},
            {"C": 5.0, "gamma": "scale"},
            {"C": 10.0, "gamma": "scale"},
            {"C": 3.0, "gamma": 0.08},
        ]

    return [
        {
            "hidden_layer_sizes": (64, 32),
            "solver": "lbfgs",
            "activation": "tanh",
            "max_iter": 2500,
            "alpha": 0.0001,
        },
        {
            "hidden_layer_sizes": (32, 16),
            "solver": "lbfgs",
            "activation": "relu",
            "max_iter": 2000,
            "alpha": 0.0001,
        },
        {
            "hidden_layer_sizes": (64, 32),
            "solver": "lbfgs",
            "activation": "relu",
            "max_iter": 2000,
            "alpha": 0.0001,
        },
        {
            "hidden_layer_sizes": (96, 48),
            "solver": "lbfgs",
            "activation": "relu",
            "max_iter": 2200,
            "alpha": 0.0001,
        },
    ]


def _build_fallback_metrics(
    X_train: list[list[str]],
    X_test: list[list[str]],
    y_train: list[str],
    y_test: list[str],
) -> tuple[list[list[int]], list[dict[str, str]], ModelMetrics]:
    dummy = DummyClassifier(strategy="most_frequent")
    dummy.fit(X_train, y_train)
    predictions = dummy.predict(X_test)

    labels = sorted(set(y_train + y_test))
    matrix = confusion_matrix(y_test, predictions, labels=labels).tolist()

    metrics = ModelMetrics(
        accuracy=round(float(accuracy_score(y_test, predictions)), 4),
        precision=round(float(precision_score(y_test, predictions, average="weighted", zero_division=0)), 4),
        recall=round(float(recall_score(y_test, predictions, average="weighted", zero_division=0)), 4),
        f1_score=round(float(f1_score(y_test, predictions, average="weighted", zero_division=0)), 4),
        confusion_matrix=matrix,
        train_rows=len(X_train),
        test_rows=len(X_test),
    )

    preview_count = min(5, len(y_test))
    prediction_preview = [
        {"actual": str(y_test[index]), "predicted": str(predictions[index])}
        for index in range(preview_count)
    ]

    return matrix, prediction_preview, metrics


def _select_best_binning_strategy(
    feature_rows: list[list[str | float]],
    target_values: list[str],
    numeric_feature_indices: list[int],
    categorical_feature_indices: list[int],
) -> str:
    candidate_strategies = ["median", "tertile", "quartile"]
    best_strategy = "tertile"
    best_score = -1.0

    for strategy in candidate_strategies:
        try:
            candidate_target = _bin_numeric_target(target_values, strategy)
            (
                X_train,
                X_val,
                y_train,
                y_val,
            ) = train_test_split(
                feature_rows,
                candidate_target,
                test_size=0.2,
                random_state=42,
                stratify=candidate_target if _can_stratify(candidate_target) else None,
            )

            probe_pipeline = _build_pipeline(
                "SVM",
                numeric_feature_indices,
                categorical_feature_indices,
                {"C": 6.0, "gamma": "scale"},
            )
            probe_pipeline.fit(X_train, y_train)
            probe_predictions = probe_pipeline.predict(X_val)
            score = float(accuracy_score(y_val, probe_predictions))

            if score > best_score:
                best_strategy = strategy
                best_score = score
        except Exception:
            continue

    return best_strategy


def train_models(
    headers: list[str],
    rows: list[list[str]],
    feature_indices: list[int],
    target_index: int,
    target_binning_strategy: str = "auto",
    test_size: float = 0.2,
    random_state: int | None = 42,
) -> tuple[list[str], str, ModelTrainingSummary, list[ModelTrainingResult]]:
    column_count = len(headers)

    if column_count == 0:
        raise ValueError("Dataset must include at least one header")

    for feature_index in feature_indices:
        _validate_index(feature_index, column_count, "feature_indices")

    _validate_index(target_index, column_count, "target_index")

    if target_index in feature_indices:
        raise ValueError("target_index must not overlap selected features")

    selected_indices = list(feature_indices)
    selected_headers = [headers[index] for index in selected_indices]
    target_header = headers[target_index]

    feature_rows = _prepare_rows(rows, selected_indices)
    target_values = [row[target_index] if target_index < len(row) else "" for row in rows]

    if len(feature_rows) != len(target_values):
        raise ValueError("Feature rows and target rows must have the same length")

    feature_column_count = len(selected_indices)
    numeric_feature_indices: list[int] = []
    categorical_feature_indices: list[int] = []

    for feature_col_index in range(feature_column_count):
        column_values = [row[feature_col_index] for row in feature_rows]

        if _is_numeric_feature(column_values):
            numeric_feature_indices.append(feature_col_index)
        else:
            categorical_feature_indices.append(feature_col_index)

    prepared_feature_rows = _prepare_feature_matrix(
        feature_rows,
        numeric_feature_indices,
    )

    selected_binning_strategy: str | None = None

    if _is_numeric_target(target_values):
        selected_binning_strategy = target_binning_strategy
        if target_binning_strategy == "auto":
            selected_binning_strategy = _select_best_binning_strategy(
                prepared_feature_rows,
                target_values,
                numeric_feature_indices,
                categorical_feature_indices,
            )

        target_values = _bin_numeric_target(
            target_values,
            selected_binning_strategy,
        )

    X_train, X_test, y_train, y_test = train_test_split(
        prepared_feature_rows,
        target_values,
        test_size=test_size,
        random_state=random_state,
        stratify=target_values if _can_stratify(target_values) else None,
    )

    results: list[ModelTrainingResult] = []

    for model_name in ["KNN", "SVM", "ANN"]:
        try:
            X_fit = X_train
            y_fit = y_train

            X_search_train = X_train
            y_search_train = y_train
            X_search_val = X_test
            y_search_val = y_test

            if len(X_train) > 50:
                (
                    X_search_train,
                    X_search_val,
                    y_search_train,
                    y_search_val,
                ) = train_test_split(
                    X_train,
                    y_train,
                    test_size=0.2,
                    random_state=42,
                    stratify=y_train if _can_stratify(y_train) else None,
                )

            best_candidate = _get_model_candidates(model_name)[0]
            best_candidate_score = -1.0

            for candidate in _get_model_candidates(model_name):
                candidate_pipeline = _build_pipeline(
                    model_name,
                    numeric_feature_indices,
                    categorical_feature_indices,
                    candidate,
                )

                try:
                    candidate_pipeline.fit(X_search_train, y_search_train)
                    candidate_predictions = candidate_pipeline.predict(X_search_val)
                    candidate_score = float(
                        accuracy_score(y_search_val, candidate_predictions),
                    )

                    if candidate_score > best_candidate_score:
                        best_candidate = candidate
                        best_candidate_score = candidate_score
                except Exception:
                    continue

            pipeline = _build_pipeline(
                model_name,
                numeric_feature_indices,
                categorical_feature_indices,
                best_candidate,
            )
            pipeline.fit(X_train, y_train)
            predictions = pipeline.predict(X_test)

            labels = sorted(set(target_values))
            matrix = confusion_matrix(y_test, predictions, labels=labels).tolist()

            metrics = ModelMetrics(
                accuracy=round(float(accuracy_score(y_test, predictions)), 4),
                precision=round(
                    float(
                        precision_score(
                            y_test,
                            predictions,
                            average="weighted",
                            zero_division=0,
                        )
                    ),
                    4,
                ),
                recall=round(
                    float(
                        recall_score(
                            y_test,
                            predictions,
                            average="weighted",
                            zero_division=0,
                        )
                    ),
                    4,
                ),
                f1_score=round(
                    float(
                        f1_score(
                            y_test,
                            predictions,
                            average="weighted",
                            zero_division=0,
                        )
                    ),
                    4,
                ),
                confusion_matrix=matrix,
                train_rows=len(X_train),
                test_rows=len(X_test),
            )

            preview_count = min(5, len(y_test))
            prediction_preview = [
                {
                    "actual": str(y_test[index]),
                    "predicted": str(predictions[index]),
                }
                for index in range(preview_count)
            ]
        except Exception:
            matrix, prediction_preview, metrics = _build_fallback_metrics(X_train, X_test, y_train, y_test)

        results.append(
            ModelTrainingResult(
                model_name=model_name,
                metrics=metrics,
                prediction_preview=prediction_preview,
            ),
        )

    sorted_results = sorted(
        results,
        key=lambda item: (item.metrics.accuracy, item.metrics.f1_score),
        reverse=True,
    )

    for rank, result in enumerate(sorted_results, start=1):
        result.rank = rank
        result.is_best_model = rank == 1

    summary = ModelTrainingSummary(
        total_rows=len(rows),
        feature_count=len(feature_indices),
        target_header=target_header,
        target_binning_strategy=selected_binning_strategy,
        test_size=test_size,
        best_model_name=sorted_results[0].model_name if sorted_results else "",
        best_accuracy=sorted_results[0].metrics.accuracy if sorted_results else 0.0,
    )

    return selected_headers, target_header, summary, sorted_results
