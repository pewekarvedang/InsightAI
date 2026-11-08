@echo off
echo ===================================================
echo Starting InsightAI Business Intelligence Platform
echo ===================================================

set OLLAMA_MODELS=D:\ollama_models

echo Checking Ollama service...
netstat -aon | findstr :11434 | findstr LISTENING >nul 2>&1
if %errorlevel% neq 0 (
    echo Starting Ollama with models on D:\ollama_models...
    start "Ollama" /min cmd /c "set OLLAMA_MODELS=D:\ollama_models && ollama serve"
)

echo Clearing any existing processes on port 8000 and 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo [1/2] Starting FastAPI Backend on port 8000...
start "InsightAI Backend" cmd /k "cd /d %~dp0 && .\venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"

echo [2/2] Starting Vite Frontend on port 5173...
start "InsightAI Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ===================================================
echo Servers are running!
echo - Frontend UI:     http://localhost:5173
echo - Backend API:     http://127.0.0.1:8000
echo - Swagger Docs:    http://127.0.0.1:8000/docs
echo - AI Model:        Google Gemma 4B on D:\ollama_models
echo ===================================================
