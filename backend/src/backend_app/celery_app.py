from celery import Celery

from backend_app.config import settings

celery = Celery(
    "backend_app",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["backend_app.tasks"],
)

celery.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)
