# Mnesya — Backend

FastAPI backend for the Mnesya reminder platform. Handles authentication, profile management, reminders, pairing, push notifications, and background scheduling.

---

## Requirements

| Tool       | Version            |
| ---------- | ------------------ |
| Python     | ≥ 3.11             |
| PostgreSQL | ≥ 13               |
| Docker     | ≥ 24 (recommended) |

---

## Quick Start (Docker — recommended)

```bash
# 1 — Clone the repo
git clone https://github.com/krapaud/mnesya.git
cd mnesya

# 2 — Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env (see Environment Variables section)

# 3 — Start the stack
cd docker
cp .env.example .env   # fill in DB credentials and SECRET_KEY
docker compose up --build
```

The API will be available at `http://localhost:8000`.  
Swagger UI: `http://localhost:8000/docs` (Basic Auth required).

---

## Quick Start (Local — without Docker)

```bash
cd backend

# 1 — Create virtual environment
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# 2 — Install dependencies
pip install -r requirements.txt

# 3 — Configure environment
cp .env.example .env
# Edit .env with your local PostgreSQL credentials

# 4 — Run database migrations
alembic upgrade head

# 5 — Start the API
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 6 — Start the background worker (separate terminal)
python -m worker.scheduler
```

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in:

| Variable            | Required | Description                                                                        |
| ------------------- | -------- | ---------------------------------------------------------------------------------- |
| `DATABASE_URL`      | ✅       | PostgreSQL connection string (e.g. `postgresql://user:pass@localhost:5432/mnesya`) |
| `SECRET_KEY`        | ✅       | JWT signing key — generate with `openssl rand -hex 32`                             |
| `DOCS_USERNAME`     | ✅       | HTTP Basic Auth username for Swagger/ReDoc access                                  |
| `DOCS_PASSWORD`     | ✅       | HTTP Basic Auth password for Swagger/ReDoc access                                  |
| `TEST_DATABASE_URL` | Tests    | Separate DB used by pytest                                                         |
| `TESTING`           | CI       | Set to `true` to disable rate limiting in tests                                    |

> **Never commit `.env` files.**

---

## Project Structure

```
backend/
├── app/
│   ├── __init__.py          # FastAPI app factory, DB init, CORS, docs auth
│   ├── main.py              # App entry point, router registration
│   ├── config.py            # Runtime configuration
│   ├── limiter.py           # SlowAPI rate-limiter instance
│   ├── api/                 # HTTP route handlers
│   │   ├── authentication.py
│   │   ├── caregiver.py
│   │   ├── user.py
│   │   ├── pairing.py
│   │   ├── reminder.py
│   │   ├── reminder_status_api.py
│   │   └── push_notification.py
│   ├── models/              # SQLAlchemy ORM models
│   ├── schemas/             # Pydantic request/response schemas
│   ├── services/            # Business logic façades
│   ├── persistence/         # Repository pattern (DB access)
│   └── test/                # pytest tests
├── worker/
│   └── scheduler.py         # APScheduler background jobs
├── alembic/                 # Database migrations
│   └── versions/
├── performance_tests/
│   └── locustfile.py        # Locust load tests
├── requirements.txt
├── alembic.ini
├── pytest.ini
└── Dockerfile
```

---

## Database Migrations

```bash
# Apply all pending migrations
alembic upgrade head

# Create a new migration after changing a model
alembic revision --autogenerate -m "description"

# Rollback one migration
alembic downgrade -1

# Show migration history
alembic history
```

---

## Running Tests

Tests run against a separate test database in a Docker stack.

```bash
# Full test suite (recommended — uses docker-compose.test.yml)
cd docker
docker compose -f docker-compose.test.yml up --build --abort-on-container-exit

# Local pytest (requires TEST_DATABASE_URL in .env)
cd backend
pytest -v
```

Coverage report:

```bash
pytest --cov=app --cov-report=html
# Open htmlcov/index.html
```

**Expected results:** 165 passed, 0 failed.

---

## API Documentation

| URL             | Description             |
| --------------- | ----------------------- |
| `/docs`         | Swagger UI (Basic Auth) |
| `/redoc`        | ReDoc (Basic Auth)      |
| `/openapi.json` | Raw OpenAPI 3.0 schema  |

See [docs/api.md](../docs/api.md) for the full static reference.

---

## Background Worker

The `worker/scheduler.py` runs **APScheduler** and handles push notification delivery:

| Job             | Trigger      | Action                                                 |
| --------------- | ------------ | ------------------------------------------------------ |
| Check reminders | Every minute | For each due reminder: send push at T+0, T+5, T+10 min |
| Alert caregiver | After T+10   | If no response from user, notify the caregiver         |

Start the worker separately:

```bash
python -m worker.scheduler
```

Or via Docker Compose (it runs as the `worker` service).

---

## Rate Limiting

Powered by **slowapi** (`app/limiter.py`):

| Endpoint                  | Limit      |
| ------------------------- | ---------- |
| `POST /api/auth/register` | 3 / minute |
| `POST /api/auth/login`    | 5 / minute |

Set `TESTING=true` to disable limits in test environments (UUID key strategy).

---

## Deployment (Production — Coolify)

Production runs via `docker/docker-compose.prod.yml`. All environment variables are injected by Coolify — no `.env` file needed in production.

Required Coolify variables:

```
POSTGRES_USER
POSTGRES_PASSWORD
POSTGRES_DB
DATABASE_URL
SECRET_KEY
DOCS_USERNAME
DOCS_PASSWORD
```

The backend command runs migrations automatically on startup:

```
alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000
```

---

## Key Dependencies

| Package           | Version | Purpose                    |
| ----------------- | ------- | -------------------------- |
| `fastapi`         | 0.104.1 | HTTP framework             |
| `uvicorn`         | 0.24.0  | ASGI server                |
| `sqlalchemy`      | 2.0.23  | ORM                        |
| `alembic`         | 1.12.1  | Database migrations        |
| `python-jose`     | 3.3.0   | JWT (HS256)                |
| `bcrypt`          | 4.0.1   | Password hashing           |
| `slowapi`         | 0.1.9   | Rate limiting              |
| `apscheduler`     | 3.10.4  | Background job scheduler   |
| `psycopg2-binary` | 2.9.9   | PostgreSQL adapter         |
| `httpx`           | 0.25.2  | Async HTTP (Expo push API) |
