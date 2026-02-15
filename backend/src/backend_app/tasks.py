from __future__ import annotations

from backend_app.celery_app import celery
from backend_app.config import settings
from backend_app.exports import (
    gotenberg_html_to_pdf_bytes,
    pandoc_html_to_docx_bytes,
    write_output_bytes,
)


@celery.task(name="backend_app.tasks.render_pdf_from_html")
def render_pdf_from_html(html: str) -> dict:
    pdf = gotenberg_html_to_pdf_bytes(settings.gotenberg_url, html)
    path = write_output_bytes(settings.output_dir, ".pdf", pdf)
    return {"path": path, "bytes": len(pdf)}


@celery.task(name="backend_app.tasks.convert_docx_from_html")
def convert_docx_from_html(html: str) -> dict:
    docx = pandoc_html_to_docx_bytes(settings.pandoc_url, html)
    path = write_output_bytes(settings.output_dir, ".docx", docx)
    return {"path": path, "bytes": len(docx)}
