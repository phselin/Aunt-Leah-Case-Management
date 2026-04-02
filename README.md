# Aunt-Leah-Info-Management-System

Aunt Leah Group A's project repository

Deployed link: https://aunt-leah-content-management-system.vercel.app/

A case management system for [Aunt Leah's](https://auntleahs.org/) that solves problems with their existing OTIS system. The case system system includes features such as client management, intake form, case notes, progress tracker, program-wide reports, staff and program management

## To run the application

### Prerequisites

- **Docker**: Docker Desktop (macOS/Windows) or Docker Engine (Linux) must be installed **and running**.
- **Docker Compose v2**: `docker compose version` should work (Compose plugin).
- **Make**: `make` installed (macOS: Xcode CLT; Linux: `build-essential` / `make` package).
- **Free ports** (defaults): `8000` (API), `3000` (Gotenberg), `27017` (MongoDB), `6379` (Redis).
  - If these are taken, set `API_PORT`, `GOTENBERG_PORT`, `MONGO_PORT`, `REDIS_PORT` in `backend/.env`.
- **NPM**: Latest version of Node.js package manager `npm`
- **sudo**: Administrative(sudo) privileges for docker if you are running linux (or you can run `sudo make build`)

Build + start everything (from root folder):

```bash
make build
make up
cd frontend
npm install
npm run dev
```

Your application will be ready to use and require login. Please have an authenticator app (Google Authenticator). Log in using any one of the following accounts (each has a different role)

### Super-admin

email: admin@auntleah.org \
password: password

### Admin

email: gkiczales@auntleah.org \
password: trustTheNaturalRecursion

### Caseworker

email: caseworker@auntleah.org \
password: 12345

Once you are logged in, you will be required to scan a QR code and enter a new password and an OTP code from your authenticator app of choice. Remember the next password if you log out and log in next time!

## Backend tests, endpoints and database

Open:

- API: `http://localhost:8000`
- Gotenberg: `http://localhost:3000`

Try:

- `GET|POST|PATCH|DELETE /people`
- `GET /db/ping`

Run checks:

```bash
make lint
make test
```

- `make up` seeds the database but if you would like do it yourself, you can run `make clean` followed by `make up`
- `make down` detroys the docker containers but preservers the mongodb volume so you can stop the backend api without destroying the database
