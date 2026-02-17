from flask import Blueprint, request, jsonify

from backend_app.exports import gotenberg_html_to_pdf_bytes
from backend_app.config import settings
from backend_app.celery_app import celery

pdf_bp = Blueprint("pdf", __name__)

@pdf_bp.post("/exports/pdf")
def export_pdf():
    payload = request.get_json(silent=True) or {}
    html = payload.get("html")
    if not isinstance(html, str):
        return jsonify({"detail": "html is required"}), 422

    pdf = gotenberg_html_to_pdf_bytes(settings.gotenberg_url, html)
    return (
        pdf,
        200,
        {
            "Content-Type": "application/pdf",
            "Content-Disposition": 'attachment; filename="export.pdf"',
        },
    )

@pdf_bp.post("/tasks/pdf")
def enqueue_pdf():
    payload = request.get_json(silent=True) or {}
    html = payload.get("html")
    if not isinstance(html, str):
        return jsonify({"detail": "html is required"}), 422

    res = celery.send_task("backend_app.tasks.render_pdf_from_html", args=[html])
    return jsonify({"task_id": res.id})

# TODO download exported pdf

