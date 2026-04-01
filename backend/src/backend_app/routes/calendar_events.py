from datetime import date, datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, jsonify, request
from flask_jwt_extended import current_user, jwt_required
from pymongo import ReturnDocument

from backend_app.db import db

calendar_events_bp = Blueprint("calendar_events", __name__)


def _serialize_event(event):
    event["_id"] = str(event["_id"])
    return event


def _parse_event_id(event_id: str):
    try:
        return ObjectId(event_id)
    except InvalidId:
        return None


def _validate_date(raw_date):
    if not isinstance(raw_date, str) or not raw_date.strip():
        return "date is required"
    try:
        date.fromisoformat(raw_date)
    except ValueError:
        return "date must be YYYY-MM-DD"
    return None


def _validate_event_payload(body):
    title = (body.get("title") or "").strip()
    time = (body.get("time") or "").strip()
    client_name = (body.get("clientName") or "").strip()
    start_time = (body.get("startTime") or "").strip()
    end_time = (body.get("endTime") or "").strip()
    event_type = (body.get("type") or "").strip()
    location = (body.get("location") or "").strip()
    notes = body.get("notes")
    raw_date = body.get("date")

    errors = {}

    has_itinerary_fields = bool(title and time)
    has_calendar_fields = bool(client_name and start_time and end_time)

    if not has_itinerary_fields and not has_calendar_fields:
        errors["title"] = "title is required"
        errors["time"] = "time is required"
        errors["clientName"] = "clientName is required"
        errors["startTime"] = "startTime is required"
        errors["endTime"] = "endTime is required"

    date_error = _validate_date(raw_date)
    if date_error:
        errors["date"] = date_error

    if notes is not None and not isinstance(notes, str):
        errors["notes"] = "notes must be a string"

    if errors:
        return None, errors

    payload = {
        "date": raw_date,
        "notes": notes.strip() if isinstance(notes, str) and notes.strip() else None,
    }
    if title:
        payload["title"] = title
    if time:
        payload["time"] = time
    if client_name:
        payload["clientName"] = client_name
    if start_time:
        payload["startTime"] = start_time
    if end_time:
        payload["endTime"] = end_time
    if event_type:
        payload["type"] = event_type
    if location:
        payload["location"] = location
    return payload, None


@calendar_events_bp.get("/calendar-events")
@jwt_required()
def list_calendar_events():
    query = {"createdBy": str(current_user["_id"])}

    requested_date = request.args.get("date")
    if requested_date:
        date_error = _validate_date(requested_date)
        if date_error:
            return jsonify({"detail": date_error}), 400
        query["date"] = requested_date

    events = list(db.calendar_events.find(query).sort([("date", 1), ("time", 1), ("_id", 1)]))
    return jsonify([_serialize_event(event) for event in events]), 200


@calendar_events_bp.post("/calendar-events")
@jwt_required()
def create_calendar_event():
    body = request.get_json(silent=True) or {}
    event_json, errors = _validate_event_payload(body)
    if errors:
        return jsonify({"detail": "Validation error", "errors": errors}), 400

    now = datetime.now(timezone.utc).isoformat()
    event_json["createdBy"] = str(current_user["_id"])
    event_json["createdAt"] = now
    event_json["updatedAt"] = now

    res = db.calendar_events.insert_one(event_json)
    event_json["_id"] = str(res.inserted_id)
    return jsonify(event_json), 201


@calendar_events_bp.get("/calendar-events/<event_id>")
@jwt_required()
def get_calendar_event(event_id):
    oid = _parse_event_id(event_id)
    if oid is None:
        return jsonify({"detail": "Invalid event ID format"}), 400

    event = db.calendar_events.find_one({"_id": oid, "createdBy": str(current_user["_id"])})
    if not event:
        return jsonify({"detail": "Event not found"}), 404

    return jsonify(_serialize_event(event)), 200


@calendar_events_bp.put("/calendar-events/<event_id>")
@jwt_required()
def update_calendar_event(event_id):
    oid = _parse_event_id(event_id)
    if oid is None:
        return jsonify({"detail": "Invalid event ID format"}), 400

    body = request.get_json(silent=True) or {}
    event_json, errors = _validate_event_payload(body)
    if errors:
        return jsonify({"detail": "Validation error", "errors": errors}), 400

    event_json["updatedAt"] = datetime.now(timezone.utc).isoformat()

    res = db.calendar_events.find_one_and_update(
        {"_id": oid, "createdBy": str(current_user["_id"])},
        {"$set": event_json},
        return_document=ReturnDocument.AFTER,
    )

    if not res:
        return jsonify({"detail": "Event not found"}), 404

    return jsonify(_serialize_event(res)), 200


@calendar_events_bp.delete("/calendar-events/<event_id>")
@jwt_required()
def delete_calendar_event(event_id):
    oid = _parse_event_id(event_id)
    if oid is None:
        return jsonify({"detail": "Invalid event ID format"}), 400

    res = db.calendar_events.delete_one({"_id": oid, "createdBy": str(current_user["_id"])})
    if res.deleted_count == 0:
        return jsonify({"detail": "Event not found"}), 404

    return jsonify({"detail": "Event deleted successfully"}), 200
