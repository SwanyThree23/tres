# SwanyThree Platform

**The AI-native creator economy platform** -- live streaming, content vaults, gamified learning, and monetization in one unified stack.

---

## Features

SwanyThree is built on five core pillars:

| Pillar | Description |
|---|---|
| **Live Streaming** | RTMP ingest, real-time chat via Socket.IO, embeddable player |
| **Content Vault** | Encrypted media storage on Cloudflare R2, tiered access control |
| **AI Services** | Local LLM (Ollama), speech-to-text (Whisper), prompt compression (LLMLingua) |
| **Monetization** | Stripe subscriptions, tipping, platform fee splitting, creator payouts |
| **Gamification** | XP system, streak multipliers, badges, leaderboards, daily challenges |

---

## Quick Start

```bash
git clone <repo-url> && cd swanythree-platform
chmod +x infrastructure/scripts/setup.sh
./infrastructure/scripts/setup.sh
```

The setup script will generate secure keys, pull Docker images, and start all services.

---

## Architecture

```
                       :80/:443
                         |
                      [ nginx ]
                      /       \
               /api/*          /*
                |                |
           [ FastAPI ]     [ React SPA ]
           port 8000       port 3000
            /  |  \
           /   |   \
    [Postgres] [Redis] [Celery]
     :5432      :6379   worker + beat
                          |
                   +----- + -----+
                   |      |      |
              [Ollama] [Whisper] [R2]
              :11434   :8001    cloud
                          |
                       [RTMP]
                       :1935
```

### Service Map

| Service | Port | Purpose |
|---|---|---|
| nginx | 80, 443 | Reverse proxy, TLS termination, rate limiting |
| api (FastAPI) | 8000 | REST API, WebSocket, business logic |
| frontend (React) | 3000 | SPA served via nginx |
| postgres | 5432 | Primary database |
| redis | 6379 | Cache, session store, pub/sub |
| celery-worker | -- | Async task processing |
| celery-beat | -- | Scheduled tasks (streaks, payouts) |
| ollama | 11434 | Local LLM inference |
| whisper | 8001 | Speech-to-text transcription |
| rtmp | 1935, 8080 | RTMP ingest and HLS output |

---

## Tech Stack

**Backend:** Python 3.12, FastAPI, SQLAlchemy 2.0, Alembic, Celery, Socket.IO
**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Zustand, React Query
**Infrastructure:** Docker Compose, nginx, PostgreSQL 16, Redis 7
**AI:** Ollama (llama3.2), Faster Whisper, LLMLingua
**Payments:** Stripe (subscriptions, Connect, webhooks)
**Storage:** Cloudflare R2 (S3-compatible)

---

## Environment Variables

Copy the example file and fill in required values:

```bash
cp .env.example .env
```

**Required variables** (the setup script generates these automatically):

| Variable | Description |
|---|---|
| `SECRET_KEY` | JWT signing key (hex, 32 bytes) |
| `VAULT_MASTER_KEY` | Encryption key for content vault |
| `DB_PASSWORD` | PostgreSQL password |

See `.env.example` for the full list of configurable options.

---

## Development

### Prerequisites

- Docker and Docker Compose v2
- Node.js 20+ (for local frontend development)
- Python 3.12+ (for local backend development)

### Run locally without Docker

**Backend:**
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Database Migrations

```bash
# Run inside the api container
docker exec -it st3-api alembic upgrade head

# Create a new migration
docker exec -it st3-api alembic revision --autogenerate -m "description"
```

### Seed Data

```bash
chmod +x infrastructure/scripts/seed.sh
./infrastructure/scripts/seed.sh
```

This creates test accounts: `admin@swanythree.com` and `creator@swanythree.com`.

### API Documentation

Once running, interactive API docs are available at:

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

---

## Project Structure

```
swanythree-platform/
  backend/              Python API (FastAPI)
  frontend/             React SPA (Vite + TypeScript)
  infrastructure/
    docker/             nginx.conf, init-db.sql
    scripts/            setup.sh, migrate.sh, seed.sh
  docs/                 Additional documentation
  docker-compose.yml    Full service orchestration
  .env.example          Environment variable template
```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes with descriptive messages
4. Push to the branch and open a Pull Request
5. Ensure all tests pass before requesting review

---

## License

Proprietary. All rights reserved.
