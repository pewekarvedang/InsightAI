# 📊 InsightAI — AI-Powered Business Intelligence Platform

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Bundler-Vite_8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Material UI](https://img.shields.io/badge/UI-Material_UI_v9-007FFF?style=for-the-badge&logo=mui&logoColor=white)](https://mui.com/)
[![Ollama](https://img.shields.io/badge/AI_Engine-Ollama_%2F_Gemma_4B-black?style=for-the-badge&logo=ollama&logoColor=white)](https://ollama.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

**InsightAI** is an enterprise-grade, full-stack Business Intelligence & Analytics platform. Upload raw business datasets in CSV or Excel format to automatically sanitize data, generate real-time multi-dimensional executive dashboards, detect statistical anomalies, evaluate SWOT matrices, and converse directly with an AI Business Analyst powered by **Google Gemma 4B** through local Ollama inference.

---

## 🌟 Core Highlights

- 📁 **Universal Dataset Ingestion**: Robust handling of CSV and Excel (`.csv`, `.xlsx`, `.tsv`) with multi-encoding recovery (`utf-8`, `utf-8-sig`, `latin1`, `cp1252`), custom delimiters, and automatic repair of title rows and duplicate headers.
- 💱 **Intelligent Data Sanitization**: Automatically strips currency symbols (`₹, $, €, £, ¥`), thousand-separator commas, percentages, and accounting parentheses, turning formatted text into numerical metrics.
- 🔮 **Predictive Revenue & Demand Projections**: Forward 30/60-day statistical forecasting utilizing Holt-Winters linear exponential smoothing, damped polynomial trend regression, and expanding ~80% confidence interval bands.
- 🎛️ **Interactive "What-If" Margin Simulator**: Real-time business scenario modeling with sliders for Base Price (±30%), Discounts (±30%), COGS inflation (±30%), and Volume Elasticity (±50%), computing projected profit, margin delta (in bps), and breakeven volume sensitivity.
- 📊 **Period-over-Period Comparative Analytics**: Dual upload pipeline to compare two business periods (e.g. Q1 vs Q2, YoY) with variance % badges, top product gainers/decliners tables, and comparative charts.
- 💬 **Conversational Text-to-Chart in AI Chatbot**: Context-grounded business advisor powered by **Google Gemma 4B** (`gemma3:4b` / `gemma4`) via local Ollama. Detects chart requests and dynamically streams inline Recharts (`BarChart`, `PieChart`, `AreaChart`).
- 📑 **1-Click Executive Presentation Deck (`.pptx`)**: Generates and downloads a corporate 5-slide widescreen 16:9 PowerPoint briefing (Executive Title, KPI Matrix, Entity Rankings, SWOT Evaluation, and Strategic Roadmap) via `python-pptx`.
- 🌐 **Live Data & Cloud Connectors**: Sync public Google Sheets links (auto-converts edit links to CSV stream) or raw web CSV URLs, pre-loaded 1-click sample business datasets, and persistent SQLite session history.
- 🔄 **Dual Engine Intelligence**:
  - **Financial BI Mode**: Dynamic ranking of sales, net profit, profit margins, average order value (AOV), and Pareto (80/20) concentration while blacklisting false-positive technical ID/phone columns.
  - **Volume / Master Ledger Mode**: Gracefully handles non-numeric entity logs, calculating frequency distributions so dashboards never render blank.
- ⚠️ **Automated Anomaly & Outlier Auditing**: Instant flagging of loss-making products and order value spikes exceeding 3.5× normal transaction thresholds.
- 🧹 **1-Click Data Cleaning**: Automatic removal of duplicate rows, median/mode imputation of missing values, and export of cleaned CSVs.
- 📋 **Dataset Profiling**: Complete structural audit displaying row/column counts, memory footprint, missing value ratios, and column type breakdowns.

---

## 📸 Dashboard Showcase

![InsightAI Dashboard](screenshots/dashboard.png)

---

## 🛠️ Architecture & Tech Stack

```
InsightAI Architecture
├── Frontend (React 19 + Vite 8 + Material UI v9 + Recharts)
│   ├── Interactive Tabbed Navigation (Overview, Deep Analytics, AI Analyst, SWOT, Data Health, What-If Simulator, Comparison)
│   ├── Responsive Recharts (Time Series Area Chart, Predictive Forecasts, Category Donut, Product/Region Bars)
│   ├── AI Analyst Chat Interface with Dynamic Inline Text-to-Chart & Quick Prompts
│   ├── Multi-Source Data Hub (Local Files, Google Sheets URL Sync, 1-Click Samples, SQLite History)
│   └── 1-Click Corporate PowerPoint Deck (.pptx) & PDF Exporters
│
└── Backend (FastAPI + Pandas + NumPy + python-pptx + SQLite + Ollama SDK)
    ├── /dashboard            -> Data sanitization, column detection, metrics, SWOT & 30-day forecast
    ├── /export/presentation  -> Executive 16:9 widescreen 5-slide PowerPoint deck generator
    ├── /compare              -> Multi-dataset period-over-period variance & growth engine
    ├── /ingest/url           -> Google Sheets & public web CSV ingestion connector
    ├── /samples              -> Preloaded enterprise demonstration datasets
    ├── /history              -> Persistent SQLite analysis session registry
    ├── /ai/chat              -> Ground-truth context prompt engine with Recharts chart payloads
    ├── /ai/status            -> Live Ollama status, active model, and installed model registry
    ├── /ai/model             -> Runtime AI model configuration
    ├── /clean                -> Automated data cleaning & export
    └── /analyze              -> Instant structural dataset profiler
```

### Stack Breakdown

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 8, Material UI (MUI) 9, Recharts 3, Axios, React Icons |
| **Backend** | FastAPI, Python 3.12+, Uvicorn, Pandas, NumPy, python-pptx, OpenPyXL, SQLite |
| **AI / LLM** | Ollama, Google Gemma 4B (`gemma3:4b`), Meta Llama 3, Phi-3 |
| **Data Formats** | CSV, TSV, XLSX, XLS, Google Sheets |

---

## 📂 Project Directory Structure

```
InsightAI/
├── app/
│   ├── ai/
│   │   ├── analyzer.py        # Executive report generator & prompt formatter
│   │   ├── chatbot.py         # Conversational business analyst & text-to-chart engine
│   │   ├── llm.py             # Ollama dynamic model connector & fallback logic
│   │   └── prompts.py         # Structured executive analysis prompts
│   ├── services/
│   │   ├── dashboard_service.py  # Financial & volume BI metrics, SWOT, Pareto & anomaly detection
│   │   ├── forecast_service.py   # Holt-Winters exponential smoothing & confidence band projections
│   │   ├── deck_service.py       # Corporate widescreen 16:9 PowerPoint (.pptx) generator
│   │   ├── comparison_service.py # Period A vs Period B variance & growth analytics
│   │   ├── session_service.py    # Persistent SQLite session registry
│   │   ├── data_cleaner.py       # Auto-cleaning pipeline (deduplication & imputation)
│   │   └── data_profiler.py      # Statistical profiling & column typing
│   ├── utils/
│   │   └── file_manager.py    # Safe multi-encoding file loader & currency sanitizer
│   └── main.py                # FastAPI REST endpoints & CORS configuration
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── dashboard/     # KPICards, Charts, DeepAnalytics, AIChatbot, ExecutiveReport, ScenarioSimulator, DatasetComparison
│   │   │   ├── layout/        # Navbar
│   │   │   └── upload/        # Multi-tab data hub (Files, Google Sheets URL, Samples, History)
│   │   ├── pages/             # Dashboard main page
│   │   ├── services/          # Axios API client
│   │   └── theme/             # Custom enterprise MUI theme
│   ├── package.json
│   └── vite.config.js
├── datasets/                  # Sample test spreadsheets and sales CSVs
├── screenshots/               # Dashboard preview images
├── scripts/                   # Auxiliary startup scripts
├── start.bat                  # 1-Click launcher (checks Ollama, frees ports, starts both servers)
├── requirements.txt           # Python backend dependencies
└── README.md
```
├── requirements.txt           # Python backend dependencies
└── README.md
```

---

## ⚡ Quick Start

### 1. One-Click Launcher (Windows)

Simply double-click **`start.bat`** in the root directory. It automatically:
1. Verifies the local Ollama service.
2. Clears any stale port conflicts on ports `8000` and `5173`.
3. Activates the virtual environment and launches FastAPI on port `8000`.
4. Starts the Vite development server on port `5173`.

---

### 2. Manual Setup

#### Backend Setup

```bash
# Clone the repository
git clone https://github.com/pewekarvedang/InsightAI.git
cd InsightAI

# Create and activate Python virtual environment
py -3 -m venv venv
.\venv\Scripts\activate      # Windows
# source venv/bin/activate    # Linux / macOS

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```
- API is live at: `http://127.0.0.1:8000`
- Interactive Swagger docs at: `http://127.0.0.1:8000/docs`

#### Frontend Setup

```bash
# From the project root
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
- Web Dashboard is live at: `http://localhost:5173`

---

## 🤖 Configuring Local AI (Ollama & Gemma 4B)

InsightAI is pre-configured to use **Google Gemma 4B** (`gemma3:4b`) via Ollama.

1. **Install Ollama**: Download from [ollama.com](https://ollama.com).
2. **Pull the Gemma 4B Model**:
   ```bash
   ollama run gemma3:4b
   ```
3. **Model Selection in UI**:
   - In the Dashboard, open the **AI Business Analyst** tab.
   - Click the **Ollama Model Chip** in the chatbot header to switch models (e.g. `gemma3:4b`, `gemma4`, `llama3`) or pull new weights in the background.
   - If Ollama is offline, InsightAI's built-in **Deterministic Analytical Engine** automatically handles all queries without interruptions.

---

## 📡 API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Server health check |
| `POST` | `/dashboard` | Ingest CSV/Excel, sanitize data, generate metrics, preview, SWOT & 30-day forecast |
| `POST` | `/export/presentation` | Generate and download corporate 16:9 widescreen PowerPoint deck (.pptx) |
| `POST` | `/compare` | Compute Period A vs Period B variance, margin shifts, and top gainers/decliners |
| `POST` | `/ingest/url` | Ingest dataset directly from public Google Sheets or web CSV URL |
| `GET` | `/samples` | List preloaded 1-click demonstration business datasets |
| `POST` | `/samples/load/{key}` | Load a preloaded demonstration dataset with a single click |
| `GET` | `/history` | Retrieve local SQLite session history of recently audited datasets |
| `POST` | `/history/load/{id}` | Restore and reload a previously analyzed dataset session |
| `POST` | `/analyze` | Profile dataset columns, null counts, and structural schema |
| `POST` | `/clean` | Execute auto-cleaning pipeline and generate downloadable CSV |
| `GET` | `/download/{file}` | Download cleaned dataset |
| `POST` | `/ai/chat` | Query AI Analyst with dataset context, conversation history & Recharts chart payloads |
| `GET` | `/ai/status` | Check local Ollama connection, active model, and installed models |
| `POST` | `/ai/model` | Change active Ollama model at runtime |
| `POST` | `/ai/pull` | Trigger background model download via Ollama |

---

## 👨‍💻 Author

**Vedang Pewekar**  
B.Tech — Computer Science & Business Systems (CSBS)  
GitHub: [@pewekarvedang](https://github.com/pewekarvedang)

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
