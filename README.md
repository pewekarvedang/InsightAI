# 📊 InsightAI

### AI Powered Business Intelligence Platform

InsightAI is an AI-powered Business Intelligence Platform that enables users to upload business datasets (CSV/Excel), automatically analyze them, generate interactive dashboards, and provide meaningful business insights. The project is built using React, Material UI, FastAPI, and Python.

---

## 🚀 Features

- 📁 Upload CSV and Excel datasets
- 📈 Interactive dashboard with KPIs
- 📊 Sales & Profit visualizations
- 📍 Region-wise business analysis
- 🏆 Top Product & Top Region detection
- 🧹 Data Cleaning API
- 📋 Dataset Profiling
- 📑 Business Insights Generation
- 🎨 Modern Material UI Dashboard

---

## 🛠️ Tech Stack

### Frontend

- React.js
- Material UI (MUI)
- Axios
- Recharts

### Backend

- FastAPI
- Python
- Pandas
- NumPy
- Uvicorn

### Tools

- Git
- GitHub
- VS Code

---

## 📂 Project Structure

```
InsightAI
│
├── app/                  # FastAPI backend
│   ├── ai/               # Gemma LLM & Business Analyst prompts
│   ├── services/         # Dashboard metrics, data cleaner, data profiler
│   ├── utils/            # Upload & file management
│   └── main.py           # API endpoints & CORS middleware
├── frontend/             # React (Vite + Material UI + Recharts)
│   ├── src/
│   │   ├── components/   # Dashboard, charts, upload, profiling & cleaning
│   │   ├── pages/        # Dashboard layout page
│   │   ├── services/     # Axios API client
│   │   └── theme/        # Custom MUI theme
│   └── package.json
├── datasets/             # Sample datasets for testing
├── scripts/              # 1-click launch batch scripts
├── requirements.txt      # Python dependencies
├── README.md
└── .gitignore
```

---

## 📸 Dashboard

> Add screenshots inside a folder named `screenshots/`

### Dashboard

![Dashboard](screenshots/dashboard.png)

---

## ⚙️ Installation

### ⚡ Quick Start (Windows)

Simply double-click `scripts/start_insightai.bat` to launch both Backend and Frontend in separate windows!

Or start them manually:

### Backend

```bash
# In the project root
py -3 -m venv venv

venv\Scripts\activate

pip install -r requirements.txt

uvicorn app.main:app --reload
```

Backend runs on:

```
http://127.0.0.1:8000
```

---

### Frontend

```bash
cd frontend

npm install

npm run dev
```

Frontend runs on:

```
http://localhost:5173
```

---

## 📊 Current Features

- 📁 **Multi-Format Ingestion**: Upload CSV and Excel datasets (.csv, .xlsx)
- 📈 **Interactive BI Dashboard**: Hero KPIs with profit margins, AOV, and volume metrics
- 📉 **Time Series & Trend Analysis**: Chronological revenue & profit area/line graphs
- 📦 **Category Breakdown**: Donut / Pie distribution charts with revenue percentage share
- 🏆 **Product & Region Rankings**: Best performers, loss leaders, and geographic traction
- 🎯 **Pareto (80/20) Analytics**: Analysis of catalog dependency and revenue concentration
- ⚠️ **Anomaly & Risk Detection**: Automated flagging of negative margins and order value outliers
- 💬 **AI Business Analyst Chatbot**: Conversational BI powered by Gemma 3 / Analytical Engine with suggested prompt chips
- 📑 **Strategic SWOT Matrix & Executive Briefing**: Strengths, Weaknesses, Opportunities, and Threats with Print / Save PDF
- 📋 **Dataset Profiling**: Structural health diagnostics, memory footprint, null counts, and column types
- 🧹 **Automated Data Cleaning**: 1-click pipeline removing duplicates, imputing missing data, and exporting cleaned CSVs

---

## 🚧 Upcoming Features

- 📊 Multiple Dataset Comparison & Merging
- 👤 User Authentication & Role-Based Access Control
- ☁️ Cloud Deployment (AWS / GCP / Docker Containerization)

---

## 🎯 Example Workflow

```
Upload Dataset

        ↓

Backend Analysis

        ↓

Data Cleaning

        ↓

Dashboard Generation

        ↓

Business Insights

        ↓

AI Recommendations (Upcoming)
```

---

## 👨‍💻 Author

**Vedang Pewekar**

Final Year B.Tech Project

Computer Science & Business Systems

---

## 📄 License

This project is developed for educational and learning purposes.