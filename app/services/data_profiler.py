import pandas as pd


def profile_dataset(df: pd.DataFrame):
    numeric_columns = df.select_dtypes(include="number").columns.tolist()
    categorical_columns = df.select_dtypes(include=["object", "category"]).columns.tolist()
    datetime_columns = df.select_dtypes(include=["datetime64"]).columns.tolist()

    missing_by_column = {
        str(col): int(count)
        for col, count in df.isnull().sum().items()
        if count > 0
    }

    profile = {
        "rows": len(df),
        "columns": len(df.columns),
        "column_names": list(df.columns),
        "numeric_columns": numeric_columns,
        "categorical_columns": categorical_columns,
        "datetime_columns": datetime_columns,
        "data_type_distribution": {
            "numeric": len(numeric_columns),
            "categorical": len(categorical_columns),
            "datetime": len(datetime_columns),
        },
        "missing_values": int(df.isnull().sum().sum()),
        "missing_by_column": missing_by_column,
        "column_missing_values": missing_by_column,
        "missing_values_by_column": missing_by_column,
        "duplicate_rows": int(df.duplicated().sum()),
        "memory_usage_mb": round(
            df.memory_usage(deep=True).sum() / 1024 / 1024,
            2,
        ),
    }

    return profile