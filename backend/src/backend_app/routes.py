from __future__ import annotations

from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel
from pymongo import ReturnDocument
from pymongo.errors import PyMongoError

from backend_app.celery_app import celery
from backend_app.config import settings
from backend_app.db import get_examples_collection, get_mongo_client, ping_mongo
from backend_app.exports import (
    gotenberg_html_to_pdf_bytes,
    pandoc_html_to_docx_bytes,
)

router = APIRouter()


class HtmlPayload(BaseModel):
    html: str

class ExampleModel(BaseModel):
    message: str


# Health
@router.get("/health")
def health():
    return {"status": "ok", "framework": "fastapi"}


# Example GET, POST, PATCH, DELETE routes
@router.get("/example")
def example_get_route():
    client = get_mongo_client()
    try:
        coll = get_examples_collection(client)
        doc = coll.find_one(sort=[("_id", -1)])
        message = doc["message"] if doc else "Hello, World!"
        return {"status": "ok", "framework": "fastapi", "message": message}
    except PyMongoError as exc:
        raise HTTPException(status_code=503, detail="MongoDB unavailable") from exc
    finally:
        client.close()


@router.post("/example")
def example_put_route(payload: ExampleModel):
    client = get_mongo_client()
    try:
        coll = get_examples_collection(client)
        res = coll.insert_one({"message": payload.message})
        return {
            "status": "ok",
            "framework": "fastapi",
            "message": payload.message,
            "id": str(res.inserted_id),
        }
    except PyMongoError as exc:
        raise HTTPException(status_code=503, detail="MongoDB unavailable") from exc
    finally:
        client.close()


@router.patch("/example")
def example_patch_route(payload: ExampleModel):
    client = get_mongo_client()
    try:
        coll = get_examples_collection(client)
        doc = coll.find_one_and_update(
            filter={},
            update={"$set": {"message": payload.message}},
            sort=[("_id", -1)],
            return_document=ReturnDocument.AFTER,
        )
        if doc is None:
            res = coll.insert_one({"message": payload.message})
            return {
                "status": "ok",
                "framework": "fastapi",
                "message": payload.message,
                "id": str(res.inserted_id),
            }
        return {
            "status": "ok",
            "framework": "fastapi",
            "message": doc["message"],
            "id": str(doc["_id"]),
        }
    except PyMongoError as exc:
        raise HTTPException(status_code=503, detail="MongoDB unavailable") from exc
    finally:
        client.close()


@router.delete("/example")
def example_delete_route(payload: ExampleModel):
    client = get_mongo_client()
    try:
        coll = get_examples_collection(client)
        doc = coll.find_one_and_delete(filter={}, sort=[("_id", -1)])
        return {
            "status": "ok",
            "framework": "fastapi",
            "message": (doc["message"] if doc else payload.message),
            "deleted": doc is not None,
        }
    except PyMongoError as exc:
        raise HTTPException(status_code=503, detail="MongoDB unavailable") from exc
    finally:
        client.close()


@router.get("/db/ping")
def db_ping():
    ok = ping_mongo()
    return {"ok": ok}


@router.post("/exports/pdf")
def export_pdf(payload: HtmlPayload):
    pdf = gotenberg_html_to_pdf_bytes(settings.gotenberg_url, payload.html)
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="export.pdf"'},
    )


@router.post("/exports/docx")
def export_docx(payload: HtmlPayload):
    docx = pandoc_html_to_docx_bytes(settings.pandoc_url, payload.html)
    return Response(
        content=docx,
        media_type=("application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
        headers={"Content-Disposition": 'attachment; filename="export.docx"'},
    )


@router.post("/tasks/pdf")
def enqueue_pdf(payload: HtmlPayload):
    res = celery.send_task("backend_app.tasks.render_pdf_from_html", args=[payload.html])
    return {"task_id": res.id}


@router.post("/tasks/docx")
def enqueue_docx(payload: HtmlPayload):
    res = celery.send_task("backend_app.tasks.convert_docx_from_html", args=[payload.html])
    return {"task_id": res.id}
