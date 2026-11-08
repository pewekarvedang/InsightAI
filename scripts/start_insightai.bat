@echo off
echo Starting InsightAI Backend and Frontend...

start "InsightAI Backend" cmd /k "cd /d %~dp0.. && call venv\Scripts\activate && uvicorn app.main:app --reload"

start "InsightAI Frontend" cmd /k "cd /d %~dp0..\frontend && npm run dev"