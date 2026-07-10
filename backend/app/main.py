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

        return {
            "message": "Dataset uploaded and analyzed successfully",
            "filename": file.filename,
            "rows": int(dataframe.shape[0]),
            "columns": int(dataframe.shape[1]),
            "column_names": dataframe.columns.tolist(),
            "missing_values": {
                column: int(value)
                for column, value in dataframe.isnull().sum().items()
            },
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