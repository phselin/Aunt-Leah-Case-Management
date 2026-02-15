# Aunt-Leah-Info-Management-System
Aunt Leah Group A's project repository

## To run backend
Copy environment defaults (optional):

```bash
cp .env.example .env
```

Build + start everything:

```bash
make build
make up
```

Open:

- API: `http://localhost:8000`
- Gotenberg: `http://localhost:3000`
- Pandoc API: `http://localhost:3100`

Try:

- `GET|POST|PATCH|DELETE /example`
- `GET /db/ping`
- `POST /exports/pdf`
- `POST /exports/docx`
- `POST /tasks/pdf` (enqueue Celery job)
- `POST /tasks/docx` (enqueue Celery job)

Run checks:

```bash
make lint
make test
```
