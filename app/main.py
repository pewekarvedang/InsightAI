from io import BytesIO
from pathlib import Path
import shutil

import pandas as pd
from pydantic import BaseModel
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from app.ai.analyzer import generate_ai_report
from app.ai.chatbot import ask_business_chatbot
from app.services.dashboard_service import generate_dashboard
from app.services.data_cleaner import clean_dataset
from app.services.data_profiler import profile_dataset
from app.utils.file_manager import (
    get_output_path,
    save_uploaded_file,
    load_dataset_safely,
)

app = FastAPI(
    title="InsightAI API",
    description="Backend API for the AI-powered Business Intelligence Platform",
    version="0.3.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:5176",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "Welcome to InsightAI",
        "status": "running",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
    }


@app.post("/analyze")
async def analyze_dataset(file: UploadFile = File(...)):
    file_name = file.filename.lower()

    if not file_name.endswith((".csv", ".xlsx")):
        raise HTTPException(
            status_code=400,
            detail="Only CSV and Excel (.xlsx) files are supported.",
        )

    try:
        saved_file = save_uploaded_file(file)
        dataframe = load_dataset_safely(saved_file)

        profile = profile_dataset(dataframe)

        return {
            "message": "Dataset analyzed successfully",
            "file_name": file.filename,
            "profile": profile,
            "preview": dataframe.head(5).fillna("").to_dict(
                orient="records"
            ),
        }

    except Exception as error:
        raise HTTPException(
            status_code=400,
            detail=f"Unable to analyze the dataset: {str(error)}",
        )


@app.post("/clean")
async def clean_uploaded_dataset(
    file: UploadFile = File(...)
):
    file_name = file.filename.lower()

    if not file_name.endswith((".csv", ".xlsx")):
        raise HTTPException(
            status_code=400,
            detail="Only CSV and Excel (.xlsx) files are supported.",
        )

    try:
        saved_file = save_uploaded_file(file)
        dataframe = load_dataset_safely(saved_file)

        before_cleaning = profile_dataset(dataframe)

        cleaned_dataframe, cleaning_report = clean_dataset(dataframe)

        after_cleaning = profile_dataset(cleaned_dataframe)

        output_file = get_output_path(".csv")

        cleaned_dataframe.to_csv(
            output_file,
            index=False,
        )
        return {
            "message": "Dataset cleaned successfully",
            "file_name": file.filename,
            "saved_file": str(saved_file),
            "cleaned_file": str(output_file),
            "download_filename": output_file.name,
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
            ),
        }

    except Exception as error:
        raise HTTPException(
            status_code=400,
            detail=f"Unable to clean the dataset: {str(error)}",
        )


@app.get("/download/{filename}")
async def download_file(filename: str):
    file_path = Path("outputs") / filename

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail="File not found.",
        )

    return FileResponse(
        path=file_path,
        filename=file_path.name,
        media_type="text/csv",
    )


@app.post("/dashboard")
async def dashboard(file: UploadFile = File(...)):
    file_name = file.filename.lower()

    if not file_name.endswith((".csv", ".xlsx")):
        raise HTTPException(
            status_code=400,
            detail="Only CSV and Excel files are supported.",
        )

    try:
        saved_file = save_uploaded_file(file)
        dataframe = load_dataset_safely(saved_file)
        dashboard_data = generate_dashboard(dataframe)

        # Generate AI report with fallback if Ollama is not running
        try:
            ai_report = generate_ai_report(dashboard_data)
        except Exception:
            ai_report = (
                "AI report unavailable: Could not connect to Ollama. "
                "Make sure Ollama is running and the gemma3:4b model is pulled."
            )

        return {
            "message": "Dashboard generated successfully",
            "dashboard": dashboard_data,
            "preview": dataframe.head(5).fillna("").to_dict(orient="records"),
            "column_mapping": dashboard_data.get("column_mapping", {}),
            "metric_mode": dashboard_data.get("metric_mode", "currency"),
            "ai_report": ai_report,
        }

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


@app.post("/ai/analyze")
async def ai_analyze(file: UploadFile = File(...)):
    file_name = file.filename.lower()

    if not file_name.endswith((".csv", ".xlsx")):
        raise HTTPException(
            status_code=400,
            detail="Only CSV and Excel (.xlsx) files are supported.",
        )

    try:
        saved_file = save_uploaded_file(file)
        dataframe = load_dataset_safely(saved_file)
        dashboard_data = generate_dashboard(dataframe)

        try:
            report = generate_ai_report(dashboard_data)
        except Exception:
            report = (
                "AI report unavailable: Could not connect to Ollama. "
                "Make sure Ollama is running and the gemma3:4b model is pulled."
            )

        return {
            "dashboard": dashboard_data,
            "ai_report": report,
        }

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Unable to analyze dataset: {str(e)}",
        )


class ChatRequest(BaseModel):
    question: str
    dashboard: dict
    history: list = []


@app.post("/ai/chat")
async def chat_with_analyst(payload: ChatRequest):
    try:
        if not payload.question.strip():
            raise HTTPException(status_code=400, detail="Question cannot be empty.")
        result = ask_business_chatbot(payload.question, payload.dashboard, payload.history)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")


class ModelConfigRequest(BaseModel):
    model: str


@app.get("/ai/status")
def get_ai_status():
    from app.ai.llm import get_active_model, get_installed_models
    try:
        installed = get_installed_models()
        active = get_active_model()
        return {
            "ollama_available": True,
            "active_model": active,
            "installed_models": installed,
            "supported_models": [
                "gemma4",
                "gemma:4b",
                "gemma3:4b",
                "gemma2:2b",
                "gemma2:9b",
                "gemma2",
                "gemma:2b",
                "gemma:7b",
                "llama3",
                "phi3"
            ],
            "pull_command": f"ollama run {active}"
        }
    except Exception as e:
        return {
            "ollama_available": False,
            "active_model": "gemma3:4b",
            "installed_models": [],
            "error": str(e),
            "pull_command": "ollama run gemma3:4b"
        }


@app.post("/ai/model")
def update_ai_model(req: ModelConfigRequest):
    from app.ai.llm import set_active_model
    updated = set_active_model(req.model)
    return {
        "message": f"Active AI model updated to '{updated}'.",
        "active_model": updated
    }


@app.post("/ai/pull")
def pull_ai_model(req: ModelConfigRequest):
    import threading
    target_model = req.model.strip()

    def _pull_thread():
        try:
            import ollama
            ollama.pull(target_model)
        except Exception as err:
            print(f"Error pulling model {target_model}: {err}")

    thread = threading.Thread(target=_pull_thread, daemon=True)
    thread.start()
    return {
        "message": f"Pulling model '{target_model}' in the background.",
        "model": target_model,
        "hint": f"You can also run `ollama run {target_model}` directly in your terminal."
    }

