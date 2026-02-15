from __future__ import annotations

import subprocess
import tempfile
from pathlib import Path

from fastapi import FastAPI, Response
from pydantic import BaseModel


class HtmlPayload(BaseModel):
    html: str

app = FastAPI(title="Pandoc API", version="0.1.0")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/convert/docx")
def convert_docx(payload: HtmlPayload):
    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        in_html = tmp_path / "input.html"
        out_docx = tmp_path / "output.docx"
        in_md.write_text(payload.html, encoding="utf-8")

        proc = subprocess.run(
            ["pandoc", str(in_md), "-o", str(out_docx)],
            capture_output=True,
            text=True,
        )
        if proc.returncode != 0:
            detail = (proc.stderr or proc.stdout or "pandoc failed").strip()
            return Response(content=detail, status_code=500, media_type="text/plain")

        data = out_docx.read_bytes()
        return Response(
            content=data,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": 'attachment; filename="export.docx"'},
        )
