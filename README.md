# Aunt-Leah-Info-Management-System
Aunt Leah Group A's project repository

## To run backend
### Prerequisites

- **Docker**: Docker Desktop (macOS/Windows) or Docker Engine (Linux) must be installed **and running**.
- **Docker Compose v2**: `docker compose version` should work (Compose plugin).
- **Make**: `make` installed (macOS: Xcode CLT; Linux: `build-essential` / `make` package).
- **Free ports** (defaults): `8000` (API), `3000` (Gotenberg), `27017` (MongoDB), `6379` (Redis).
  - If these are taken, set `API_PORT`, `GOTENBERG_PORT`, `MONGO_PORT`, `REDIS_PORT` in `backend/.env`.

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

Try:

- `GET|POST|PATCH|DELETE /example`
- `GET /db/ping`
- `POST /exports/pdf`
- `POST /tasks/pdf`

Run checks:

```bash
make lint
make test
```
