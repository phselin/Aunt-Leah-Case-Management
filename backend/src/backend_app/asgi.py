from a2wsgi import WSGIMiddleware

from backend_app.flask_app import create_flask_app

# ASGI entrypoint for uvicorn. Flask-only app wrapped for ASGI hosting.
app = WSGIMiddleware(create_flask_app())  # type: ignore
