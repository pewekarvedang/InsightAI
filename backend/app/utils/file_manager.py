from pathlib import Path
from uuid import uuid4
import shutil

UPLOAD_DIR = Path("uploads")
OUTPUT_DIR = Path("outputs")

UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)


def save_uploaded_file(upload_file):
    extension = Path(upload_file.filename).suffix

    filename = f"{uuid4()}{extension}"

    destination = UPLOAD_DIR / filename

    with destination.open("wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)

    return destination


def get_output_path(extension=".csv"):
    filename = f"cleaned_{uuid4()}{extension}"
    return OUTPUT_DIR / filename