from flask import Blueprint, jsonify, request
from pymongo import ReturnDocument
from pymongo.errors import PyMongoError
from flask_jwt_extended import jwt_required

from backend_app.db import db

example_bp = Blueprint("example", __name__)


@example_bp.route("/example", methods=["GET", "POST", "PATCH", "DELETE"])
@jwt_required()
def example():
    payload = request.get_json(silent=True) or {}
    message = payload.get("message")

    try:
        coll = db.examples

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
