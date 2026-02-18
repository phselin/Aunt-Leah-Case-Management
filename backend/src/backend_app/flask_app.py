from __future__ import annotations

from datetime import timedelta

from flask import Flask
from flask_cors import CORS

from backend_app.auth import auth_bp
from backend_app.auth_init import bcrypt, jwt
from backend_app.config import settings

from backend_app.routes.example import example_bp
from backend_app.routes.health import health_bp
from backend_app.routes.pdf import pdf_bp
from backend_app.routes.sections import sections_bp


def create_flask_app() -> Flask:
    app = Flask(__name__)
    
    CORS(app, origins=["http://localhost:5173"], supports_credentials=True)
    app.config["JWT_SECRET_KEY"] = settings.JWT_SECRET_KEY
    app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
    # app.config["JWT_COOKIE_SECURE"] = True # True in production
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=15)
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=7)

    bcrypt.init_app(app)
    jwt.init_app(app)

    app.register_blueprint(auth_bp)

    app.register_blueprint(health_bp)
    app.register_blueprint(pdf_bp)
    app.register_blueprint(example_bp)
    app.register_blueprint(sections_bp)

    return app


if __name__ == "__main__":
    app = create_flask_app()
    app.run(debug=True)
