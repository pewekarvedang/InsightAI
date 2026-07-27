from io import BytesIO

import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile

from app.services.data_profiler import profile_dataset
from app.services.data_cleaner import clean_dataset

from pathlib import Path
import shutil

from app.utils.file_manager import (
    save_uploaded_file,
    get_output_path
)

from fastapi.responses import FileResponse
from app.services.dashboard_service import generate_dashboard

from fastapi.middleware.cors import CORSMiddleware

from app.ai.analyzer import generate_ai_report

app = FastAPI(
    title="InsightAI API",
    description="Backend API for the AI-powered Business Intelligence Platform",
    version="0.3.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
        saved_file = save_uploaded_file(file)

        if saved_file.suffix == ".csv":
            dataframe = pd.read_csv(saved_file)

        else:
            dataframe = pd.read_excel(saved_file)

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

@app.post("/clean")
async def clean_uploaded_dataset(
    file: UploadFile = File(...)
):
    file_name = file.filename.lower()

    if not file_name.endswith(
        (".csv", ".xlsx")
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Only CSV and Excel "
                "(.xlsx) files are supported."
            )
        )

    try:
        saved_file = save_uploaded_file(file)

        if saved_file.suffix == ".csv":
            dataframe = pd.read_csv(saved_file)

        else:
            dataframe = pd.read_excel(saved_file)

        before_cleaning = profile_dataset(
            dataframe
        )

        cleaned_dataframe, cleaning_report = (
            clean_dataset(dataframe)
        )

        after_cleaning = profile_dataset(
            cleaned_dataframe
        )

        output_file = get_output_path(".csv")

        cleaned_dataframe.to_csv(
            output_file,
            index=False
        )
        return {
            "message": (
                "Dataset cleaned successfully"
            ),
            "file_name": file.filename,
            "saved_file": str(saved_file),
            "cleaned_file": str(output_file),
            "before_cleaning": before_cleaning,
            "cleaning_report": cleaning_report,
            "after_cleaning": after_cleaning,
            "cleaned_preview": (
                cleaned_dataframe
                .head(5)
                .fillna("")
                .to_dict(
                    orient="records"
                )
            )
        }

    except Exception as error:
        raise HTTPException(
            status_code=400,
            detail=(
                "Unable to clean the dataset: "
                f"{str(error)}"
            )
        )
    
    from pathlib import Path

@app.get("/download/{filename}")
async def download_file(filename: str):

    file_path = Path("outputs") / filename

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail="File not found."
        )

    return FileResponse(
        path=file_path,
        filename=file_path.name,
        media_type="text/csv"
    )
@app.post("/dashboard")
async def dashboard(file: UploadFile = File(...)):

    file_name = file.filename.lower()

    if not file_name.endswith((".csv", ".xlsx")):
        raise HTTPException(
            status_code=400,
            detail="Only CSV and Excel files are supported."
        )

    try:
        saved_file = save_uploaded_file(file)

        if saved_file.suffix == ".csv":
            dataframe = pd.read_csv(saved_file)
        else:
            dataframe = pd.read_excel(saved_file)

        dashboard = generate_dashboard(dataframe)

        # Generate AI report
        ai_report = generate_ai_report(dashboard)

        return {
            "message": "Dashboard generated successfully",
            "dashboard": dashboard,
            "ai_report": ai_report
        }

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    @app.post("/ai/analyze")
    async def ai_analyze(file: UploadFile = File(...)):

        saved_file = save_uploaded_file(file)

    if saved_file.suffix == ".csv":
        dataframe = pd.read_csv(saved_file)
    else:
        dataframe = pd.read_excel(saved_file)

    dashboard = generate_dashboard(dataframe)

    report = generate_ai_report(dashboard)

    return {
        "dashboard": dashboard,
        "ai_report": report
    }