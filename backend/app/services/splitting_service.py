from sklearn.model_selection import train_test_split
from app.schemas.splitting import SplitSummary


def split_dataset(
    headers: list[str],
    rows: list[list[str]],
    test_size: float = 0.2,
    random_state: int | None = None,
) -> tuple[dict, dict, SplitSummary]:
    """
    Partitions a dataset into separate training and testing subsets.
    
    This is a crucial step in machine learning to evaluate model performance on unseen data.
    Uses scikit-learn's `train_test_split` under the hood.

    Args:
        headers: The list of column names for the dataset.
        rows: The 2D list of data points to be split.
        test_size: The proportion of the dataset to include in the test split (e.g., 0.2 for 20%).
        random_state: An optional seed for reproducible output across multiple function calls.

    Returns:
        A tuple containing:
        1. A dictionary representing the training set (headers and rows).
        2. A dictionary representing the testing set (headers and rows).
        3. A SplitSummary object containing statistical metrics about the split for the UI.
    """
    
    # 1. Input Validation
    if not headers or not rows:
        raise ValueError("Dataset must contain headers and rows")
    
    # Ensure the test size is a valid proportion
    if not (0 < test_size < 1):
        raise ValueError("test_size must be between 0 and 1 (exclusive)")
    
    # 2. Perform the Split
    # We only need to split the rows; the headers remain the same for both sets
    train_rows, test_rows = train_test_split(
        rows,
        test_size=test_size,
        random_state=random_state,
    )
    
    # 3. Format the Output
    # Reattach the headers to the newly split row subsets
    train_set = {
        "headers": headers,
        "rows": train_rows,
    }
    
    test_set = {
        "headers": headers,
        "rows": test_rows,
    }
    
    # 4. Generate Telemetry/Summary
    # Calculate exact counts and percentages to display to the user
    summary = SplitSummary(
        total_rows=len(rows),
        train_rows=len(train_rows),
        test_rows=len(test_rows),
        train_percentage=round((len(train_rows) / len(rows)) * 100, 2),
        test_percentage=round((len(test_rows) / len(rows)) * 100, 2),
    )
    
    return train_set, test_set, summary