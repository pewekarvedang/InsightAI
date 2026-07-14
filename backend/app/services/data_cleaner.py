import re

import pandas as pd


def clean_column_name(column_name: str) -> str:
    column_name = str(column_name).strip().lower()

    column_name = re.sub(
        r"[^a-zA-Z0-9]+",
        "_",
        column_name
    )

    return column_name.strip("_")


def clean_dataset(df: pd.DataFrame):
    cleaned_df = df.copy()

    cleaning_report = {
        "original_rows": int(cleaned_df.shape[0]),
        "original_columns": int(cleaned_df.shape[1]),
        "empty_rows_removed": 0,
        "empty_columns_removed": 0,
        "duplicate_rows_removed": 0,
        "numeric_values_filled": 0,
        "text_values_filled": 0,
        "column_names_standardized": []
    }

    # Remove completely empty rows
    rows_before = cleaned_df.shape[0]

    cleaned_df = cleaned_df.dropna(
        how="all"
    )

    cleaning_report["empty_rows_removed"] = (
        rows_before - cleaned_df.shape[0]
    )

    # Remove completely empty columns
    columns_before = cleaned_df.shape[1]

    cleaned_df = cleaned_df.dropna(
        axis=1,
        how="all"
    )

    cleaning_report["empty_columns_removed"] = (
        columns_before - cleaned_df.shape[1]
    )

    # Standardize column names
    old_columns = list(cleaned_df.columns)

    new_columns = [
        clean_column_name(column)
        for column in old_columns
    ]

    cleaned_df.columns = new_columns

    for old_name, new_name in zip(
        old_columns,
        new_columns
    ):
        if str(old_name) != new_name:
            cleaning_report[
                "column_names_standardized"
            ].append(
                {
                    "old_name": str(old_name),
                    "new_name": new_name
                }
            )

    # Remove duplicate records
    duplicates_before = int(
        cleaned_df.duplicated().sum()
    )

    cleaned_df = cleaned_df.drop_duplicates()

    cleaning_report[
        "duplicate_rows_removed"
    ] = duplicates_before

    # Fill missing values
    for column in cleaned_df.columns:

        missing_count = int(
            cleaned_df[column]
            .isnull()
            .sum()
        )

        if missing_count == 0:
            continue

        if pd.api.types.is_numeric_dtype(
            cleaned_df[column]
        ):
            median_value = (
                cleaned_df[column]
                .median()
            )

            cleaned_df[column] = (
                cleaned_df[column]
                .fillna(median_value)
            )

            cleaning_report[
                "numeric_values_filled"
            ] += missing_count

        else:
            cleaned_df[column] = (
                cleaned_df[column]
                .fillna("Unknown")
            )

            cleaning_report[
                "text_values_filled"
            ] += missing_count

    cleaning_report["cleaned_rows"] = int(
        cleaned_df.shape[0]
    )

    cleaning_report["cleaned_columns"] = int(
        cleaned_df.shape[1]
    )

    return cleaned_df, cleaning_report