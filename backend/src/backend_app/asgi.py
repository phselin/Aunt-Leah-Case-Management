from a2wsgi import WSGIMiddleware
from fastapi import FastAPI

from backend_app.flask_app import create_flask_app
from backend_app.routes import router

app = FastAPI(title="Aunt Leah's CMS", version="0.1.0")
app.include_router(router)

# Flask inside the same monolith, mounted under /flask
app.mount("/flask", WSGIMiddleware(create_flask_app()))
