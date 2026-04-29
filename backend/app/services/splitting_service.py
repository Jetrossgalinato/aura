from sklearn.model_selection import train_test_split
from app.schemas.splitting import SplitSummary


def split_dataset(
    headers: list[str],
    rows: list[list[str]],
    test_size: float = 0.2,
    random_state: int | None = None,
) -> tuple[dict, dict, SplitSummary]:
    # Split dataset into training and testing sets using scikit-learn.
    # Returns separate dictionaries for train and test data along with summary statistics.
    
    if not headers or not rows:
        raise ValueError("Dataset must contain headers and rows")
    
    if not (0 < test_size < 1):
        raise ValueError("test_size must be between 0 and 1 (exclusive)")
    
    # Split rows into train and test sets
    train_rows, test_rows = train_test_split(
        rows,
        test_size=test_size,
        random_state=random_state,
    )
    
    train_set = {
        "headers": headers,
        "rows": train_rows,
    }
    
    test_set = {
        "headers": headers,
        "rows": test_rows,
    }
    
    summary = SplitSummary(
        total_rows=len(rows),
        train_rows=len(train_rows),
        test_rows=len(test_rows),
        train_percentage=round((len(train_rows) / len(rows)) * 100, 2),
        test_percentage=round((len(test_rows) / len(rows)) * 100, 2),
    )
    
    return train_set, test_set, summary
