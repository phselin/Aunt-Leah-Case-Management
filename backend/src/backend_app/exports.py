from __future__ import annotations

import uuid
from pathlib import Path

import requests


def _ensure_dir(path: str) -> None:
    Path(path).mkdir(parents=True, exist_ok=True)


def write_output_bytes(output_dir: str, suffix: str, data: bytes) -> str:
    _ensure_dir(output_dir)
    filename = f"{uuid.uuid4().hex}{suffix}"
    out_path = Path(output_dir) / filename
    out_path.write_bytes(data)
    return str(out_path)


def gotenberg_html_to_pdf_bytes(gotenberg_url: str, html: str) -> bytes:
    url = gotenberg_url.rstrip("/") + "/forms/chromium/convert/html"
    files = {"files": ("index.html", html.encode("utf-8"), "text/html; charset=utf-8")}
    resp = requests.post(url, files=files, timeout=60)
    resp.raise_for_status()
    return resp.content


def pandoc_html_to_docx_bytes(pandoc_url: str, html: str) -> bytes:
    url = pandoc_url.rstrip("/") + "/convert/docx"
    resp = requests.post(url, json={"html": html}, timeout=60)
    resp.raise_for_status()
    return resp.content
