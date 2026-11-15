import sqlite3
import json
from pathlib import Path
from datetime import datetime

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DB_PATH = BASE_DIR / "outputs" / "history.db"


def init_db():
    (BASE_DIR / "outputs").mkdir(exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS dataset_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                file_name TEXT NOT NULL,
                saved_path TEXT NOT NULL,
                file_size_kb REAL,
                total_rows INTEGER,
                total_revenue REAL,
                total_profit REAL,
                metric_mode TEXT,
                top_product TEXT,
                top_region TEXT,
                created_at TEXT NOT NULL
            )
        """)
        conn.commit()


init_db()


def record_dataset_session(file_name: str, saved_path: str, df_len: int, dashboard: dict, file_size_bytes: int = 0):
    """Save an analysis record to local SQLite history."""
    try:
        init_db()
        rev = float(dashboard.get("total_revenue", 0.0))
        profit = float(dashboard.get("total_profit", 0.0)) if dashboard.get("total_profit") is not None else None
        mode = dashboard.get("metric_mode", "currency")
        top_p = dashboard.get("top_product", "N/A")
        top_r = dashboard.get("top_region", "N/A")
        size_kb = round(file_size_bytes / 1024, 1)

        with sqlite3.connect(DB_PATH) as conn:
            conn.execute("""
                INSERT INTO dataset_history (
                    file_name, saved_path, file_size_kb, total_rows,
                    total_revenue, total_profit, metric_mode, top_product, top_region, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                file_name, str(saved_path), size_kb, df_len,
                rev, profit, mode, top_p, top_r, datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            ))
            conn.commit()
    except Exception as e:
        print(f"Error logging session history: {e}")


def get_dataset_history(limit: int = 15) -> list:
    """Retrieve list of recently analyzed datasets."""
    try:
        init_db()
        with sqlite3.connect(DB_PATH) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, file_name, saved_path, file_size_kb, total_rows,
                       total_revenue, total_profit, metric_mode, top_product, top_region, created_at
                FROM dataset_history
                ORDER BY id DESC
                LIMIT ?
            """, (limit,))
            rows = cursor.fetchall()
            return [dict(r) for r in rows]
    except Exception as e:
        print(f"Error fetching session history: {e}")
        return []
