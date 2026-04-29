import numpy as np
from sklearn.exceptions import ConvergenceWarning
from sklearn.dummy import DummyClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import accuracy_score, confusion_matrix, f1_score, precision_score, recall_score
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OrdinalEncoder
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


def _prepare_rows(rows: list[list[str]], indices: list[int]) -> list[list[str]]:
    projected_rows: list[list[str]] = []

    for row in rows:
        projected_rows.append([row[index] if index < len(row) else "" for index in indices])

    return projected_rows


def _build_pipeline(model_name: str) -> Pipeline:
    if model_name == "KNN":
        classifier = KNeighborsClassifier(n_neighbors=3)
    elif model_name == "SVM":
        classifier = SVC(kernel="rbf", probability=False)
    else:
        classifier = MLPClassifier(hidden_layer_sizes=(32, 16), max_iter=500, random_state=42)

    return Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("encoder", OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)),
            ("classifier", classifier),
        ],
    )


def _can_stratify(target_values: list[str]) -> bool:
    label_counts: dict[str, int] = {}

    for value in target_values:
        label_counts[value] = label_counts.get(value, 0) + 1

    return len(label_counts) > 1 and min(label_counts.values()) > 1


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


def train_models(
    headers: list[str],
    rows: list[list[str]],
    feature_indices: list[int],
    target_index: int,
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

    X_train, X_test, y_train, y_test = train_test_split(
        feature_rows,
        target_values,
        test_size=test_size,
        random_state=random_state,
        stratify=target_values if _can_stratify(target_values) else None,
    )

    results: list[ModelTrainingResult] = []

    for model_name in ["KNN", "SVM", "ANN"]:
        try:
            pipeline = _build_pipeline(model_name)
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

    summary = ModelTrainingSummary(
        total_rows=len(rows),
        feature_count=len(feature_indices),
        target_header=target_header,
        test_size=test_size,
    )

    return selected_headers, target_header, summary, results
