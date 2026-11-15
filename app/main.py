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
from app.services.deck_service import create_executive_deck
from app.services.comparison_service import compare_datasets
from app.services.session_service import record_dataset_session, get_dataset_history
from app.utils.file_manager import (
    get_output_path,
    save_uploaded_file,
    load_dataset_safely,
)

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOADS_DIR = BASE_DIR / "uploads"
OUTPUTS_DIR = BASE_DIR / "outputs"
DATASETS_DIR = BASE_DIR / "datasets"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)
DATASETS_DIR.mkdir(parents=True, exist_ok=True)

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

        # Record analysis session into persistent history
        try:
            record_dataset_session(
                file_name=file.filename,
                saved_path=str(saved_file),
                df_len=len(dataframe),
                dashboard=dashboard_data,
                file_size_bytes=saved_file.stat().st_size if saved_file.exists() else 0
            )
        except Exception:
            pass

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


class PresentationRequest(BaseModel):
    dashboard: dict
    file_name: str = "Dataset"


@app.post("/export/presentation")
def export_presentation(req: PresentationRequest):
    """Generate and download a branded widescreen 16:9 executive briefing PowerPoint deck (.pptx)."""
    try:
        out_path = create_executive_deck(req.dashboard, req.file_name)
        return FileResponse(
            path=out_path,
            filename=out_path.name,
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate presentation: {str(e)}")


@app.post("/compare")
async def compare_two_datasets(
    file_a: UploadFile = File(...),
    file_b: UploadFile = File(...),
    label_a: str = "Period A",
    label_b: str = "Period B"
):
    """Compare two business datasets (e.g. Q1 vs Q2, YoY, or Budget vs Actual)
    to compute growth variance, margin shifts, and top gainers/decliners.
    """
    try:
        saved_a = save_uploaded_file(file_a)
        saved_b = save_uploaded_file(file_b)
        df_a = load_dataset_safely(saved_a)
        df_b = load_dataset_safely(saved_b)

        result = compare_datasets(df_a, df_b, label_a=label_a, label_b=label_b)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Comparison failed: {str(e)}")


class UrlIngestRequest(BaseModel):
    url: str


@app.post("/ingest/url")
async def ingest_dataset_from_url(req: UrlIngestRequest):
    """Sync and analyze a dataset directly from a public URL or Google Sheets export link."""
    import httpx
    from uuid import uuid4
    raw_url = req.url.strip()

    # Convert Google Sheets view/edit link to export CSV link if applicable
    if "docs.google.com/spreadsheets" in raw_url:
        if "/edit" in raw_url:
            raw_url = raw_url.split("/edit")[0] + "/export?format=csv"
        elif not raw_url.endswith("/export?format=csv"):
            raw_url = raw_url.rstrip("/") + "/export?format=csv"

    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
            resp = await client.get(raw_url)
            if resp.status_code != 200:
                raise HTTPException(status_code=400, detail=f"Server returned HTTP status {resp.status_code}")

        content = resp.content
        dest = UPLOADS_DIR / f"{uuid4()}.csv"
        with open(dest, "wb") as f:
            f.write(content)

        dataframe = load_dataset_safely(dest)
        dashboard_data = generate_dashboard(dataframe)

        try:
            ai_report = generate_ai_report(dashboard_data)
        except Exception:
            ai_report = "AI report unavailable: Ensure local Ollama is active."

        record_dataset_session(
            file_name="Google_Sheet_Sync.csv",
            saved_path=str(dest),
            df_len=len(dataframe),
            dashboard=dashboard_data,
            file_size_bytes=len(content)
        )

        return {
            "message": "Dataset synced and analyzed successfully from URL",
            "file_name": "Google_Sheet_Sync.csv",
            "dashboard": dashboard_data,
            "preview": dataframe.head(5).fillna("").to_dict(orient="records"),
            "column_mapping": dashboard_data.get("column_mapping", {}),
            "metric_mode": dashboard_data.get("metric_mode", "currency"),
            "ai_report": ai_report,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to ingest URL: {str(e)}")


@app.get("/history")
def list_history():
    """Retrieve list of recently analyzed datasets from local SQLite session history."""
    return get_dataset_history(limit=15)


@app.post("/history/load/{history_id}")
def load_from_history(history_id: int):
    """Restore and reload a previously analyzed dataset session."""
    import sqlite3
    db_path = OUTPUTS_DIR / "history.db"
    if not db_path.exists():
        raise HTTPException(status_code=404, detail="No dataset history records found yet")

    with sqlite3.connect(db_path) as conn:
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute("SELECT file_name, saved_path FROM dataset_history WHERE id = ?", (history_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Dataset history not found")

        saved_file = Path(row["saved_path"])
        if not saved_file.exists():
            raise HTTPException(status_code=404, detail="Saved dataset file was moved or deleted")

        dataframe = load_dataset_safely(saved_file)
        dashboard_data = generate_dashboard(dataframe)
        try:
            ai_report = generate_ai_report(dashboard_data)
        except Exception:
            ai_report = "AI report unavailable: Ensure local Ollama is active."

        return {
            "message": "Dataset restored from history",
            "file_name": row["file_name"],
            "dashboard": dashboard_data,
            "preview": dataframe.head(5).fillna("").to_dict(orient="records"),
            "column_mapping": dashboard_data.get("column_mapping", {}),
            "metric_mode": dashboard_data.get("metric_mode", "currency"),
            "ai_report": ai_report,
        }


SAMPLES = {
    "amazon_sales": {
        "id": "amazon_sales",
        "name": "Amazon Retail Sales (1,465 Rows)",
        "filename": "amazon_sales_sample.csv",
        "description": "Consumer electronics, cables, accessories with prices and discounts."
    },
    "fmcg_targets": {
        "id": "fmcg_targets",
        "name": "Regional FMCG Outlet Targets (Spreadsheet)",
        "filename": "fmcg_outlet_targets.xlsx",
        "description": "Multi-region retail targets, universe outlets, and coverage percentages."
    },
    "party_ledger": {
        "id": "party_ledger",
        "name": "Enterprise Party Ledger (Catalog Master)",
        "filename": "enterprise_party_ledger.csv",
        "description": "Master data catalog with zones, brand classifications, and account names."
    }
}


@app.get("/samples")
def list_sample_datasets():
    """List preloaded demonstration datasets for 1-click testing."""
    return list(SAMPLES.values())


@app.post("/samples/load/{sample_key}")
def load_sample_dataset(sample_key: str):
    """Load a preloaded sample dataset with a single click."""
    if sample_key not in SAMPLES:
        raise HTTPException(status_code=404, detail="Sample dataset not found")
    sample_info = SAMPLES[sample_key]
    file_path = DATASETS_DIR / sample_info["filename"]
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Sample file not found on disk")

    dataframe = load_dataset_safely(file_path)
    dashboard_data = generate_dashboard(dataframe)
    try:
        ai_report = generate_ai_report(dashboard_data)
    except Exception:
        ai_report = "AI report unavailable: Ensure local Ollama is active."

    record_dataset_session(
        file_name=sample_info["filename"],
        saved_path=str(file_path),
        df_len=len(dataframe),
        dashboard=dashboard_data,
        file_size_bytes=file_path.stat().st_size
    )

    return {
        "message": f"Sample dataset '{sample_info['name']}' loaded successfully",
        "file_name": sample_info["filename"],
        "dashboard": dashboard_data,
        "preview": dataframe.head(5).fillna("").to_dict(orient="records"),
        "column_mapping": dashboard_data.get("column_mapping", {}),
        "metric_mode": dashboard_data.get("metric_mode", "currency"),
        "ai_report": ai_report,
    }


