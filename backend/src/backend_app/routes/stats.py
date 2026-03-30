from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from backend_app.db import db
from backend_app.routes.routes_utils import is_admin

stats_bp = Blueprint("stats", __name__)


@stats_bp.get("/stats")
@jwt_required()
def get_stats():
    if not is_admin():
        return jsonify({"detail": "Access denied"}), 403
    stats = {}
    stats["clients"] = {"total": db.people.count_documents({})}
    for program in db.programs.find({}):
        program_name = program["name"]
        stats["clients"][program_name] = db.people.count_documents({"programs": program_name})
        stats[program_name] = {}
        for milestone_tree_type, milestones in program.get("milestoneTree", {}).items():
            stats[program_name][milestone_tree_type] = []
            for milestone in milestones:
                stats[program_name][milestone_tree_type].append(
                    {
                        "milestone": milestone,
                        "value": db.people.count_documents(
                            {
                                f"programMilestones.{program_name}.{milestone_tree_type}.value": milestone  # noqa: E501
                            }
                        ),
                    }
                )
    return jsonify(stats)
