from fastapi import FastAPI

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