import pandas as pd


def profile_dataset(df: pd.DataFrame) -> dict:
    total_cells = df.shape[0] * df.shape[1]
    missing_cells = int(df.isnull().sum().sum())

    if total_cells == 0:
        data_quality_score = 0
    else:
        data_quality_score = round(
            (1 - missing_cells / total_cells) * 100,
            2
        )

    column_details = []

    for column in df.columns:
        column_details.append(
            {
                "column_name": str(column),
                "data_type": str(df[column].dtype),
                "missing_values": int(df[column].isnull().sum()),
                "unique_values": int(df[column].nunique())
            }
        )

    return {
        "rows": int(df.shape[0]),
        "columns": int(df.shape[1]),
        "duplicate_rows": int(df.duplicated().sum()),
        "missing_cells": missing_cells,
        "data_quality_score": data_quality_score,
        "column_details": column_details
    }