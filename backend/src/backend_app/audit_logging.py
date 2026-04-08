"""
Audit.py: Contains functionality for logging user-actions and events within the application.
"""

import functools
from collections.abc import Callable
from datetime import datetime

from flask_jwt_extended import current_user

from backend_app.db import db


def audit_log(action: str | Callable[..., str],
              details: str | Callable[..., str] = "",
              audit_tools = False):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            audit_ctx = {"action": action, "details": details}

            # Make sure function runs and does it's checks before we try to append entry
            retval = func(*args, **kwargs, _audit_ctx=audit_ctx) if audit_tools \
                else func(*args, **kwargs)

            # return early on fail
            if retval[1] // 100 != 2:
                return retval

            username = current_user.get("firstname") + " " + current_user.get("lastname")

            # Resolve action and details if callables. This is used to allow dynamic parameters

            resolved_action = audit_ctx["action"](**kwargs) if callable(audit_ctx["action"]) \
                else audit_ctx["action"]
            resolved_details = audit_ctx["details"](**kwargs) if callable(audit_ctx["details"]) \
                else audit_ctx["details"]

            audit_entry = {
                "timestamp": datetime.now(),
                "action": resolved_action,
                "user": username,
            } if not resolved_details else {
                "timestamp": datetime.now(),
                "action": resolved_action,
                "user": username,
                "details": resolved_details,
            }


            db.audit.insert_one(audit_entry)
            return retval
        return wrapper
    return decorator