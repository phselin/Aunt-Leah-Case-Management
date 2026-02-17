from __future__ import annotations

from flask import Flask, jsonify, request
from pymongo import ReturnDocument
from pymongo.errors import PyMongoError

from backend_app.celery_app import celery
from backend_app.config import settings
from backend_app.db import get_examples_collection, get_mongo_client, ping_mongo
from backend_app.exports import gotenberg_html_to_pdf_bytes


def create_flask_app() -> Flask:
    app = Flask(__name__)

    @app.get("/health")
    def health():
        return jsonify({"status": "ok", "framework": "flask"})

    @app.route("/example", methods=["GET", "POST", "PATCH", "DELETE"])
    def example():
        payload = request.get_json(silent=True) or {}
        message = payload.get("message")

        client = get_mongo_client()
        try:
            coll = get_examples_collection(client)

            if request.method == "GET":
                doc = coll.find_one(sort=[("_id", -1)])
                msg = doc["message"] if doc else "Hello, World!"
                return jsonify({"status": "ok", "framework": "flask", "message": msg})

            if request.method == "POST":
                if not isinstance(message, str):
                    return jsonify({"detail": "message is required"}), 422
                res = coll.insert_one({"message": message})
                return jsonify(
                    {
                        "status": "ok",
                        "framework": "flask",
                        "message": message,
                        "id": str(res.inserted_id),
                    }
                )

            if request.method == "PATCH":
                if not isinstance(message, str):
                    return jsonify({"detail": "message is required"}), 422
                doc = coll.find_one_and_update(
                    filter={},
                    update={"$set": {"message": message}},
                    sort=[("_id", -1)],
                    return_document=ReturnDocument.AFTER,
                )
                if doc is None:
                    res = coll.insert_one({"message": message})
                    return jsonify(
                        {
                            "status": "ok",
                            "framework": "flask",
                            "message": message,
                            "id": str(res.inserted_id),
                        }
                    )
                return jsonify(
                    {
                        "status": "ok",
                        "framework": "flask",
                        "message": doc["message"],
                        "id": str(doc["_id"]),
                    }
                )

            # DELETE
            doc = coll.find_one_and_delete(filter={}, sort=[("_id", -1)])
            return jsonify(
                {
                    "status": "ok",
                    "framework": "flask",
                    "message": (doc["message"] if doc else (message or "Hello, World!")),
                    "deleted": doc is not None,
                }
            )
        except PyMongoError:
            return jsonify({"detail": "MongoDB unavailable"}), 503
        finally:
            client.close()

    @app.get("/db/ping")
    def db_ping():
        return jsonify({"ok": ping_mongo()})

    @app.post("/exports/pdf")
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

    @app.post("/tasks/pdf")
    def enqueue_pdf():
        payload = request.get_json(silent=True) or {}
        html = payload.get("html")
        if not isinstance(html, str):
            return jsonify({"detail": "html is required"}), 422

        res = celery.send_task("backend_app.tasks.render_pdf_from_html", args=[html])
        return jsonify({"task_id": res.id})

    return app


if __name__ == "__main__":
    app = create_flask_app()
    app.run(debug=True)
