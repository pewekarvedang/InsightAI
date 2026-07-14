from io import BytesIO

import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile

from app.services.data_profiler import profile_dataset


app = FastAPI(
    title="InsightAI API",
    description="Backend API for the AI-powered Business Intelligence Platform",
    version="0.2.0"
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


@app.post("/analyze")
async def analyze_dataset(file: UploadFile = File(...)):
    file_name = file.filename.lower()

    if not file_name.endswith((".csv", ".xlsx")):
        raise HTTPException(
            status_code=400,
            detail="Only CSV and Excel (.xlsx) files are supported."
        )

    try:
        file_content = await file.read()

        if file_name.endswith(".csv"):
            dataframe = pd.read_csv(BytesIO(file_content))

        else:
            dataframe = pd.read_excel(BytesIO(file_content))

        profile = profile_dataset(dataframe)

        return {
            "message": "Dataset analyzed successfully",
            "file_name": file.filename,
            "profile": profile,
            "preview": dataframe.head(5).fillna("").to_dict(
                orient="records"
            )
        }

    except Exception as error:
        raise HTTPException(
            status_code=400,
            detail=f"Unable to analyze the dataset: {str(error)}"
        )