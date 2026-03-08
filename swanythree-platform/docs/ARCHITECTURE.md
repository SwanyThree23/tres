# SwanyThree Platform — Architecture

## High-Level Overview

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│    Nginx     │────▶│   Backend    │
│  React SPA   │     │  Reverse     │     │   FastAPI    │
│  Vite + TS   │     │  Proxy       │     │  + Socket.IO │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                     ┌────────────────────────────┼────────────────────────┐
                     │                            │                        │
              ┌──────▼──────┐  ┌─────────▼────────┐  ┌──────▼──────┐
              │ PostgreSQL  │  │     Redis         │  │   Workers   │
              │   16        │  │     7             │  │   Celery    │
              └─────────────┘  └──────────────────┘  └──────┬──────┘
                                                             │
                                    ┌────────────────────────┼───────────┐
                                    │                        │           │
                             ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
                             │   Ollama    │  │   Whisper   │  │  RTMP/HLS   │
                             │  Local LLM  │  │  Transcribe │  │  nginx-rtmp │
                             └─────────────┘  └─────────────┘  └─────────────┘
```

## Monorepo Structure

```
swanythree-platform/
├── backend/                 # Python FastAPI application
│   ├── api/                 # Application entry point
│   │   ├── main.py         # FastAPI app + Socket.IO mount
│   │   ├── config.py       # Pydantic settings
│   │   ├── database.py     # Async SQLAlchemy engine
│   │   ├── dependencies.py # Shared FastAPI dependencies
│   │   ├── websocket.py    # Socket.IO event handlers
│   │   ├── middleware/      # Auth, rate limiting, CORS
│   │   └── routes/          # 11 route modules
│   ├── models/             # SQLAlchemy 2.0 ORM models
│   ├── services/           # Business logic layer
│   │   ├── vault.py        # AES-256-GCM encryption
│   │   ├── ai_wrapper.py   # LLMLingua → OpenRouter → Ollama
│   │   ├── gamification.py # XP, levels, streaks, badges
│   │   ├── guest_destinations.py  # FFmpeg RTMP fanout
│   │   ├── watch_party.py  # Synchronized playback
│   │   └── notification.py # Multi-channel notifications
│   ├── workers/            # Celery background tasks
│   └── tests/              # Pytest async test suite
├── frontend/               # React 19 SPA
│   ├── src/
│   │   ├── pages/          # 6 page components
│   │   ├── components/     # Feature + UI components
│   │   ├── stores/         # Zustand state management
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API + Socket.IO clients
│   │   └── types/          # TypeScript interfaces
│   └── vite.config.ts
├── infrastructure/
│   ├── docker/             # DB init, nginx config
│   ├── scripts/            # Setup, migration, seeding
│   └── k8s/                # Kubernetes manifests (optional)
├── docs/                   # Documentation
└── docker-compose.yml      # 12-service orchestration
```

## Core Pillars

### 1. 20-Guest Video Panel
- **Signaling**: Socket.IO WebRTC events (offer/answer/ICE)
- **Topology**: Mesh for ≤6 guests, SFU recommended for 7+
- **Panel limit**: Enforced server-side in `join_panel` event handler
- **Layout**: Dynamic grid (2→3→4→5 columns) with spotlight expansion

### 2. 90/10 Revenue Split Engine
- **Enforcement**: PostgreSQL `BEFORE INSERT` trigger on `transactions`
- **Formula**: `processor_fee = amount × 0.029 + $0.30`, then `platform_fee = net × 0.10`
- **Immutability**: Trigger fires on every insert — cannot be bypassed by application code
- **Payouts**: Celery beat schedules weekly Stripe Connect transfers

### 3. Per-Guest Streaming Destinations
- **Architecture**: FFmpeg subprocess per guest per platform
- **Key storage**: AES-256-GCM encrypted via Vault Pro service
- **Tracking**: Redis HSET for PID/status per fanout process
- **Platforms**: YouTube, Twitch, Kick, Facebook Live, X/Twitter

### 4. Embeddable HLS Player
- **Playback**: HLS.js with quality selector and fullscreen
- **Branding**: Watermark overlay, configurable via embed params
- **Embed formats**: iframe, JavaScript, React component, direct link
- **Distribution**: Served from CDN-friendly `/embed/:streamId` route

### 5. Watch Party
- **Sync**: Server-authoritative state with `server_time` for drift correction
- **Actions**: play, pause, seek, load (host-only controls)
- **State**: In-memory with Redis persistence for recovery
- **Latency**: <100ms sync accuracy via timestamp comparison

## Supporting Systems

### SwanyBot AI Co-Host
- Contextual responses during streams
- Content moderation with confidence scoring
- Task-based model routing for cost optimization

### SwanyAI Wrapper (3-Tier Pipeline)
1. **LLMLingua**: Prompt compression (reduces tokens 2-5x)
2. **OpenRouter**: Multi-model routing (GPT-4, Claude, Mixtral)
3. **Ollama**: Local fallback (Llama 3.1 8B) — zero external dependency

### Vault Pro (Encryption)
- AES-256-GCM with PBKDF2 key derivation (100,000 iterations)
- Per-value random salt + nonce
- Tamper detection via GCM authentication tag

### Gamification Engine
- 17 XP-earning actions with configurable rewards
- 15 progression levels with themed titles
- Streak multipliers: 7d→1.5x, 14d→1.75x, 30d→2.0x, 60d→3.0x
- 22+ achievement badges across 5 rarity tiers
- Weekly rotating challenges with XP rewards

## Data Flow

### Stream Lifecycle
1. Creator creates stream → receives `stream_key` + `rtmp_url`
2. OBS pushes RTMP to nginx-rtmp → generates HLS segments
3. Creator clicks "Go Live" → status transitions, XP awarded
4. Viewers join room → receive `viewer_count` updates via Socket.IO
5. Chat messages flow bidirectionally through Socket.IO
6. Tips processed via Stripe → trigger splits → notify via WebSocket
7. Creator ends stream → recording task queued → uploaded to R2

### Authentication Flow
1. Register/Login → bcrypt verify → JWT pair issued (30min access + 7d refresh)
2. API requests include `Authorization: Bearer <access_token>`
3. On 401 → frontend auto-refreshes via Axios interceptor
4. Refresh token rotation on each use

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React + TypeScript | 19.x |
| Build | Vite | 6.x |
| Styling | Tailwind CSS | 3.4 |
| State | Zustand | 5.x |
| Data Fetching | TanStack Query | 5.x |
| Animation | Framer Motion | 11.x |
| Backend | FastAPI | 0.115+ |
| ORM | SQLAlchemy (async) | 2.0 |
| Database | PostgreSQL | 16 |
| Cache/Pub-Sub | Redis | 7 |
| WebSocket | python-socketio | 5.11+ |
| Task Queue | Celery + Redis | 5.x |
| Payments | Stripe SDK | latest |
| Streaming | nginx-rtmp + FFmpeg | — |
| AI | Ollama + OpenRouter | — |
| Container | Docker Compose | 2.x |

## Security Architecture

- JWT with short-lived access tokens (30 min)
- bcrypt password hashing (12 rounds)
- AES-256-GCM for RTMP key encryption
- Redis sliding-window rate limiting
- CORS with explicit origin allowlist
- Content Security Policy via nginx headers
- Stripe webhook signature verification
- SQL injection prevention via parameterized queries (SQLAlchemy)
- XSS prevention via React DOM escaping + CSP
