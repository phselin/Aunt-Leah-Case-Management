from types import SimpleNamespace

from test_utils import auth_client, unauth_client

from backend_app import exports
from backend_app.routes import pdf


def test_pdf_unauthenticated():
    with unauth_client() as client:
        assert client.post("/exports/pdf", json={"html": "<p>x</p>"}).status_code == 401
        assert client.post("/tasks/pdf", json={"html": "<p>x</p>"}).status_code == 401


def test_export_pdf(monkeypatch):
    calls = []

    def fake_render(url, html):
        calls.append((url, html))
        return b"%PDF-1.4 fake"

    monkeypatch.setattr(pdf, "gotenberg_html_to_pdf_bytes", fake_render)
    with auth_client() as client:
        assert client.post("/exports/pdf", json={}).status_code == 422
        resp = client.post("/exports/pdf", json={"html": "<h1>Report</h1>"})
        assert resp.status_code == 200
        assert resp.headers["Content-Type"] == "application/pdf"
        assert "export.pdf" in resp.headers["Content-Disposition"]
        assert resp.data == b"%PDF-1.4 fake"
    assert calls[0][1] == "<h1>Report</h1>"


def test_enqueue_pdf(monkeypatch):
    sent = []
    monkeypatch.setattr(
        pdf.celery,
        "send_task",
        lambda name, args: sent.append((name, args)) or SimpleNamespace(id="task-1"),
    )
    with auth_client() as client:
        assert client.post("/tasks/pdf", json={"html": 5}).status_code == 422
        resp = client.post("/tasks/pdf", json={"html": "<p>x</p>"})
        assert resp.json == {"task_id": "task-1"}
    assert sent == [("backend_app.tasks.render_pdf_from_html", ["<p>x</p>"])]


def test_gotenberg_request(monkeypatch):
    captured = {}

    class FakeResponse:
        content = b"%PDF"

        def raise_for_status(self):
            pass

    def fake_post(url, files, timeout):
        captured.update(url=url, files=files, timeout=timeout)
        return FakeResponse()

    monkeypatch.setattr(exports.requests, "post", fake_post)
    assert exports.gotenberg_html_to_pdf_bytes("http://gotenberg:3000/", "<p>é</p>") == b"%PDF"
    assert captured["url"] == "http://gotenberg:3000/forms/chromium/convert/html"
    assert captured["files"]["files"][1] == "<p>é</p>".encode()


def test_write_output_bytes(tmp_path):
    path = exports.write_output_bytes(str(tmp_path / "out"), ".pdf", b"data")
    assert path.endswith(".pdf")
    assert open(path, "rb").read() == b"data"
