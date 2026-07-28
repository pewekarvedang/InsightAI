import pandas as pd


def profile_dataset(df: pd.DataFrame):

    profile = {
        "rows": len(df),
        "columns": len(df.columns),
        "column_names": list(df.columns),

        "numeric_columns":
            df.select_dtypes(include="number").columns.tolist(),

        "categorical_columns":
            df.select_dtypes(include=["object", "category"]).columns.tolist(),

        "datetime_columns":
            df.select_dtypes(include=["datetime64"]).columns.tolist(),

        "missing_values":
            int(df.isnull().sum().sum()),

        "duplicate_rows":
            int(df.duplicated().sum()),

        "memory_usage_mb":
            round(
                df.memory_usage(deep=True).sum() / 1024 / 1024,
                2
            )
    }

    return profile