# SeeWhy LIVE

**Where curiosity goes live.** A full-stack live educational streaming platform where creators explain *why* things work, viewers ask questions in real time, and AI delivers instant answers.

---

## Features

| Feature | Description |
|---|---|
| **Live Streaming** | RTMP ingest (OBS/Streamlabs) → HLS playback via nginx-rtmp |
| **Why Board** | Real-time Q&A panel — viewers upvote questions, AI answers instantly |
| **AI Co-Host** | Claude Haiku answers "why" questions live during streams |
| **Creator Studio** | Manage stream details, stream key, and live controls |
| **Real-time Chat** | Socket.IO-powered chat with auto-moderation |
| **Creator Dashboard** | Revenue breakdown, stream analytics, achievement badges |
| **Auth** | JWT access + refresh tokens, bcrypt passwords, role-based access |
| **90/10 Revenue Split** | Stripe-ready monetization (tips, subscriptions) |

---

## Architecture

```
                        :80
                          |
                    [ nginx / React SPA ]
                          |
               /api/*     |     /socket.io/*     /hls/*
                  |        |          |              |
            [ FastAPI ] ──────── [ Socket.IO ] [ nginx-rtmp ]
              port 8000                            :8080
                |    \
           [Postgres] [Redis]
            :5432      :6379
```

### Service Map

| Service | Port | Purpose |
|---|---|---|
| frontend (nginx) | 80 | React SPA + reverse proxy |
| api (FastAPI) | 8000 | REST API + Socket.IO |
| postgres | 5432 | Primary database |
| redis | 6379 | Cache, session, pub-sub |
| rtmp (nginx-rtmp) | 1935 / 8080 | RTMP ingest, HLS output |

---

## Tech Stack

**Frontend:** React 19, TypeScript 5.7, Vite 6, Tailwind CSS 3.4, Zustand, TanStack Query, Framer Motion, HLS.js, Socket.IO client

**Backend:** Python 3.12, FastAPI 0.115, SQLAlchemy 2.0 (async), python-socketio, Alembic, Redis, Celery

**AI:** Anthropic Claude Haiku (real-time why-question answering)

**Infrastructure:** Docker Compose, nginx, nginx-rtmp, PostgreSQL 16, Redis 7

---

## Quick Start

### Prerequisites

- Docker and Docker Compose v2
- `openssl` (for key generation)

### 1. Clone & configure

```bash
git clone <repo> && cd seewhy-live
cp .env.example .env
# Edit .env — at minimum set SECRET_KEY and DB_PASSWORD
# Optionally add ANTHROPIC_API_KEY for live AI answers
```

### 2. Start everything

```bash
chmod +x infrastructure/scripts/setup.sh
./infrastructure/scripts/setup.sh
```

Or manually:

```bash
docker compose up -d
```

### 3. Open

| URL | Description |
|---|---|
| http://localhost | SeeWhy LIVE app |
| http://localhost/api/docs | Swagger UI |
| rtmp://localhost:1935/live | RTMP ingest URL |

---

## Development (without Docker)

**Backend:**

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# Set env vars or create .env in project root
uvicorn backend.api.main:socket_app --reload --port 8000
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev   # Starts on http://localhost:3000
```

---

## Streaming with OBS

1. Open OBS → Settings → Stream
2. Service: **Custom**
3. Server: `rtmp://localhost:1935/live` (or your domain)
4. Stream Key: copy from Creator Studio → Stream Connection
5. Go Live in OBS, then click **Go Live** in the Creator Studio

HLS playback URL:
```
http://localhost:8080/hls/<stream-key>/index.m3u8
```

---

## Project Structure

```
seewhy-live/
├── frontend/                 React 19 + TypeScript SPA
│   └── src/
│       ├── components/       Navbar, Footer, StreamCard, VideoPlayer, ChatPanel, CreatorCard
│       ├── pages/            Home, Browse, Watch, Studio, Dashboard, Login, Register, Profile
│       ├── stores/           authStore, streamStore (Zustand)
│       └── lib/              api client (axios), utils
├── backend/                  Python FastAPI service
│   ├── api/
│   │   ├── main.py           FastAPI app + Socket.IO mount
│   │   ├── websocket.py      Socket.IO event handlers
│   │   ├── routes/           auth, streams, users
│   │   └── services/         ai (Claude Haiku)
│   ├── core/                 config, database, security, deps
│   └── models/               SQLAlchemy ORM entities
└── infrastructure/
    ├── docker/               Dockerfile.backend, Dockerfile.frontend
    ├── nginx/                nginx.conf (SPA proxy), nginx-rtmp.conf
    └── scripts/              setup.sh
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Create account |
| POST | `/api/v1/auth/login` | Get tokens |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| GET | `/api/v1/auth/me` | Current user |
| GET | `/api/v1/streams` | List streams (search, filter, live_only) |
| GET | `/api/v1/streams/featured` | Featured / live streams |
| POST | `/api/v1/streams` | Create stream |
| POST | `/api/v1/streams/{id}/go-live` | Start broadcasting |
| POST | `/api/v1/streams/{id}/end` | End stream |
| GET | `/api/v1/streams/{id}/questions` | List why-questions |
| POST | `/api/v1/streams/{id}/questions` | Submit a why-question |
| POST | `/api/v1/streams/{id}/questions/{qid}/upvote` | Upvote a question |
| GET | `/api/v1/users/{id}` | User profile |
| POST | `/api/v1/users/{id}/follow` | Follow user |

### Socket.IO Events

| Event (client → server) | Description |
|---|---|
| `join_stream` | Join a stream room |
| `leave_stream` | Leave a stream room |
| `send_message` | Send a chat message |
| `ask_why` | Post a why-question (triggers AI answer) |
| `upvote_question` | Upvote a why-question |

| Event (server → client) | Description |
|---|---|
| `chat_message` | New chat message |
| `why_question` | New why-question posted |
| `question_updated` | Question upvoted or AI answer added |
| `viewer_count` | Live viewer count update |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SECRET_KEY` | ✅ | JWT signing key (32-byte hex) |
| `DB_PASSWORD` | ✅ | PostgreSQL password |
| `DATABASE_URL` | ✅ | Full async DB URL |
| `REDIS_URL` | ✅ | Redis connection URL |
| `ANTHROPIC_API_KEY` | ⬜ | Claude AI for why-answers |
| `STRIPE_SECRET_KEY` | ⬜ | Stripe payments |
| `R2_*` | ⬜ | Cloudflare R2 VOD storage |

---

## License

Proprietary. All rights reserved. © 2026 SeeWhy LIVE.
