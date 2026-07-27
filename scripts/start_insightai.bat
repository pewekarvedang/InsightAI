@echo off

start cmd /k "cd /d D:\InsightAI\backend && call venv\Scripts\activate && uvicorn app.main:app --reload"

start cmd /k "cd /d D:\InsightAI\frontend && npm run dev"