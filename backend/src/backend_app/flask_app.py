from __future__ import annotations

from flask import Flask

from backend_app.routes.example import example_bp
from backend_app.routes.health import health_bp
from backend_app.routes.pdf import pdf_bp
from backend_app.routes.sections import sections_bp


def create_flask_app() -> Flask:
    app = Flask(__name__)

    app.register_blueprint(health_bp)
    app.register_blueprint(pdf_bp)
    app.register_blueprint(example_bp)
    app.register_blueprint(sections_bp)

    return app


if __name__ == "__main__":
    app = create_flask_app()
    app.run(debug=True)
