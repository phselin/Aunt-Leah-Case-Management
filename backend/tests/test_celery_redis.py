import redis

from src.backend_app.celery_app import celery
from src.backend_app.config import settings


def test_redis_reachable():
    r = redis.Redis.from_url(settings.redis_url)
    assert r.ping() is True


def test_celery_executes_task_with_redis_and_gotenberg(tmp_path):
    # Use Redis for broker+backend (as configured in settings).
    # Run an in-process celery worker so the test doesn't depend on the compose `worker` service.
    celery.conf.update(
        task_always_eager=False,
        task_ignore_result=False,
    )

    from celery.contrib.testing.worker import start_worker

    html = "<html><body><h1>Celery PDF</h1></body></html>"

    # Ensure outputs land somewhere writable in the API container.
    celery.conf.task_default_queue = "test"

    with start_worker(celery, perform_ping_check=False, concurrency=1, loglevel="WARNING"):
        res = celery.send_task("backend_app.tasks.render_pdf_from_html", args=[html])
        out = res.get(timeout=30)

    assert isinstance(out, dict)
    assert out["bytes"] > 100
    assert out["path"].endswith(".pdf")
