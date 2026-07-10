from io import StringIO

import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile


app = FastAPI(
    title="InsightAI API",
    description="Backend API for the AI-powered Business Intelligence Platform",
    version="0.1.0"
)


@app.get("/")
def home():
    return {
        "message": "Welcome to InsightAI",
        "status": "running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


@app.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):

    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Only CSV files are currently supported."
        )

    try:
        contents = await file.read()

        dataframe = pd.read_csv(
            StringIO(contents.decode("utf-8"))
        )

        numeric_columns = dataframe.select_dtypes(
            include=["number"]
        ).columns.tolist()

        numeric_summary = {}

        for column in numeric_columns:
            numeric_summary[column] = {
                "total": round(float(dataframe[column].sum()), 2),
                "average": round(float(dataframe[column].mean()), 2),
                "minimum": round(float(dataframe[column].min()), 2),
                "maximum": round(float(dataframe[column].max()), 2)
            }

        return {
            "message": "Dataset uploaded and analyzed successfully",

            "dataset_info": {
                "filename": file.filename,
                "rows": int(dataframe.shape[0]),
                "columns": int(dataframe.shape[1]),
                "duplicate_rows": int(dataframe.duplicated().sum())
            },

            "column_information": {
                "column_names": dataframe.columns.tolist(),

                "data_types": {
                    column: str(data_type)
                    for column, data_type in dataframe.dtypes.items()
                },

                "unique_values": {
                    column: int(dataframe[column].nunique())
                    for column in dataframe.columns
                },

                "missing_values": {
                    column: int(value)
                    for column, value in dataframe.isnull().sum().items()
                }
            },

            "numeric_summary": numeric_summary,

            "preview": dataframe.head(5).fillna("").to_dict(
                orient="records"
            )
        }


        

    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400,
            detail="The CSV file must use UTF-8 encoding."
        )

    except pd.errors.EmptyDataError:
        raise HTTPException(
            status_code=400,
            detail="The uploaded CSV file is empty."
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze the dataset: {str(error)}"
        )