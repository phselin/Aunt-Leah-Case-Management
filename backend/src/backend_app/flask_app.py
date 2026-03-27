from __future__ import annotations

import os
from datetime import timedelta

from flask import Flask
from flask_cors import CORS

from backend_app.auth import auth_bp
from backend_app.auth_init import bcrypt, jwt, limiter
from backend_app.config import settings
from backend_app.routes.casenotes import casenotes_bp
from backend_app.routes.example import example_bp
from backend_app.routes.health import health_bp
from backend_app.routes.pdf import pdf_bp
from backend_app.routes.people import people_bp
from backend_app.routes.programs import programs_bp
from backend_app.routes.sections import sections_bp


def create_flask_app() -> Flask:
    app = Flask(__name__)

    CORS(
        app,
        origins=[
            "http://localhost:5173",
            "http://localhost:5174",
            "https://aunt-leah-content-management-system.vercel.app",
        ],
        supports_credentials=True,
    )
    app.config["JWT_SECRET_KEY"] = settings.JWT_SECRET_KEY
    app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
    production = os.environ.get("ENVIRONMENT", "local").lower() == "production"
    app.config["JWT_COOKIE_SECURE"] = production  # true in production
    if production:
        app.config["JWT_COOKIE_SAMESITE"] = "None"
    app.config["JWT_COOKIE_CSRF_PROTECT"] = (
        False  # true in production (i tried to do this but couldn't make it work, maybe later)
    )
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=15)

    bcrypt.init_app(app)
    jwt.init_app(app)
    limiter.init_app(app)

    app.register_blueprint(auth_bp)

    app.register_blueprint(health_bp)
    app.register_blueprint(pdf_bp)
    app.register_blueprint(example_bp)
    app.register_blueprint(people_bp)
    app.register_blueprint(casenotes_bp)
    app.register_blueprint(sections_bp)
    app.register_blueprint(programs_bp)

    return app


if __name__ == "__main__":
    app = create_flask_app()
    app.run(debug=True)
