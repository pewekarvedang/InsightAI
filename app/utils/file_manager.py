from pathlib import Path
from uuid import uuid4
import shutil
import pandas as pd
import numpy as np

UPLOAD_DIR = Path("uploads")
OUTPUT_DIR = Path("outputs")

UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)


def save_uploaded_file(upload_file):
    extension = Path(upload_file.filename).suffix
    filename = f"{uuid4()}{extension}"
    destination = UPLOAD_DIR / filename

    with destination.open("wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)

    return destination


def get_output_path(extension=".csv"):
    filename = f"cleaned_{uuid4()}{extension}"
    return OUTPUT_DIR / filename


def deduplicate_columns(columns):
    """Ensure all column names in the dataframe are unique strings."""
    seen = {}
    new_cols = []
    for c in columns:
        clean_c = str(c).strip() if pd.notna(c) and str(c).strip() != "" else "Unnamed"
        if clean_c in seen:
            seen[clean_c] += 1
            new_cols.append(f"{clean_c}_{seen[clean_c]}")
        else:
            seen[clean_c] = 0
            new_cols.append(clean_c)
    return new_cols


def sanitize_dataframe_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Sanitize strings formatted as currency or numbers with commas/percents
    into real numeric columns so calculations and charts work accurately.
    """
    df = df.copy()
    df.columns = deduplicate_columns(df.columns)

    for col in df.columns:
        series = df[col]
        if isinstance(series, pd.DataFrame):
            series = series.iloc[:, 0]

        if pd.api.types.is_numeric_dtype(series):
            continue

        sample = series.dropna().astype(str).head(100)
        if len(sample) == 0:
            continue

        # Check if column values are numeric strings (e.g. ₹399, $1,500, 65%)
        cleaned = (
            sample
            .str.replace(r"[₹$€£¥,\s]", "", regex=True)
            .str.replace(r"^\((.*)\)$", r"-\1", regex=True)
            .str.rstrip("%")
        )
        num_parsed = pd.to_numeric(cleaned, errors="coerce")
        valid_ratio = num_parsed.notna().sum() / len(sample)

        # If >= 50% of sample values can be parsed as numbers, convert the column
        if valid_ratio >= 0.5:
            all_cleaned = (
                series
                .astype(str)
                .str.replace(r"[₹$€£¥,\s]", "", regex=True)
                .str.replace(r"^\((.*)\)$", r"-\1", regex=True)
                .str.rstrip("%")
            )
            df[col] = pd.to_numeric(all_cleaned, errors="coerce")

    return df


def load_dataset_safely(file_path: Path) -> pd.DataFrame:
    """Robustly load any CSV or Excel file handling diverse encodings,
    custom separators, Excel title rows, duplicate headers, and formatted numbers.
    """
    path = Path(file_path)
    ext = path.suffix.lower()
    df = None

    if ext in [".csv", ".tsv", ".txt"]:
        encodings = ["utf-8", "utf-8-sig", "latin1", "cp1252", "iso-8859-1"]
        for enc in encodings:
            try:
                # Try auto-detecting separator (handles comma, semicolon, tab, pipe)
                df = pd.read_csv(path, encoding=enc, sep=None, engine="python", on_bad_lines="skip")
                break
            except Exception:
                try:
                    df = pd.read_csv(path, encoding=enc, on_bad_lines="skip")
                    break
                except Exception:
                    continue

        if df is None:
            df = pd.read_csv(path, encoding_errors="replace", on_bad_lines="skip")
    else:
        # Excel (.xlsx, .xls)
        try:
            df = pd.read_excel(path)
        except Exception:
            df = pd.read_excel(path, engine="openpyxl")

    # If first columns are Unnamed: 0, Unnamed: 1, promote the first row containing textual headers
    if len(df.columns) > 1 and str(df.columns[0]).startswith("Unnamed:") and str(df.columns[1]).startswith("Unnamed:"):
        for idx in range(min(5, len(df))):
            row_vals = [str(v).strip() for v in df.iloc[idx].tolist()]
            valid_headers = [v for v in row_vals if v and v != "nan" and not v.startswith("Unnamed:")]
            if len(valid_headers) >= len(df.columns) * 0.4:
                df.columns = deduplicate_columns([str(v).strip() if str(v).strip() != "nan" else f"Col_{i}" for i, v in enumerate(df.iloc[idx])])
                df = df.iloc[idx + 1:].reset_index(drop=True)
                break

    # Clean and deduplicate column names
    df.columns = deduplicate_columns(df.columns)
    df = df.dropna(how="all", axis=1).dropna(how="all", axis=0)

    # Sanitize currency and comma-formatted numeric strings
    df = sanitize_dataframe_columns(df)

    return df
