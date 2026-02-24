# CYLive — Full-Stack Implementation Plan

## Current State Assessment

| Layer      | Current                    | Target                                 |
| ---------- | -------------------------- | -------------------------------------- |
| Frontend   | Vite + React 18 + Tailwind | Next.js 14 App Router + Tailwind       |
| Backend    | Python FastAPI + SQLite    | Next.js API Routes + Prisma + Postgres |
| Auth       | Custom JWT (homegrown)     | NextAuth.js (Email, Google, Apple)     |
| DB         | SQLite (dev) / PostgreSQL  | PostgreSQL via Prisma ORM              |
| Cache      | None                       | Redis (sessions, pub/sub, rate limit)  |
| Payments   | Basic Stripe stubs         | Full Stripe (Tips, Subs, Paywalls)     |
| Realtime   | Raw WebSocket              | Socket.io (chat, events, gifts, tips)  |
| AI         | Basic Anthropic stubs      | Full Aura AI system (4 modes, events)  |
| Storage    | None                       | AWS S3 + CloudFront CDN                |
| Streaming  | None                       | Amazon IVS / Mux (RTMP ingest)         |
| Email      | None                       | Resend (transactional email)           |
| Validation | Manual / ad-hoc            | Zod (client + server)                  |
| Forms      | Manual useState            | React Hook Form                        |
| Data Fetch | Axios + custom hooks       | SWR + fetch                            |
| Deploy     | Hostinger VPS              | Vercel (app) + Railway (DB/Redis)      |

---

## Architecture: Next.js 14 Monolith

```
c:\safe\
├── prisma/
│   └── schema.prisma           # Full database schema
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout with providers
│   │   ├── page.tsx            # Landing / Home
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx      # Authenticated shell (sidebar + header)
│   │   │   ├── page.tsx        # Dashboard home
│   │   │   ├── studio/page.tsx
│   │   │   ├── browse/page.tsx
│   │   │   ├── watch/[id]/page.tsx
│   │   │   ├── analytics/page.tsx
│   │   │   ├── marketplace/page.tsx
│   │   │   ├── audio-rooms/page.tsx
│   │   │   ├── scheduler/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   └── admin/page.tsx
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── streams/route.ts
│   │       ├── streams/[id]/route.ts
│   │       ├── payments/
│   │       │   ├── tip/route.ts
│   │       │   ├── subscribe/route.ts
│   │       │   ├── paywall/route.ts
│   │       │   ├── payout/route.ts
│   │       │   └── webhook/route.ts
│   │       ├── messages/route.ts
│   │       ├── aura/route.ts
│   │       ├── uploads/video/route.ts
│   │       ├── users/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       └── socket/route.ts
│   ├── components/
│   │   ├── ui/                 # Design system primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Toggle.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── Avatar.tsx
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── MobileNav.tsx
│   │   │   └── Shell.tsx
│   │   ├── stream/
│   │   │   ├── StreamGrid.tsx
│   │   │   ├── PanelView.tsx
│   │   │   ├── CameraPreview.tsx
│   │   │   ├── AVControls.tsx
│   │   │   └── GoldenWall.tsx
│   │   ├── chat/
│   │   │   ├── ChatPanel.tsx
│   │   │   ├── ChatMessage.tsx
│   │   │   ├── SuperChat.tsx
│   │   │   └── LanguageSelector.tsx
│   │   ├── payments/
│   │   │   ├── TipModal.tsx
│   │   │   ├── SubscribeModal.tsx
│   │   │   └── PaywallGate.tsx
│   │   ├── aura/
│   │   │   ├── AuraPanel.tsx
│   │   │   └── AuraBubble.tsx
│   │   └── providers/
│   │       ├── AuthProvider.tsx
│   │       ├── SocketProvider.tsx
│   │       └── ThemeProvider.tsx
│   ├── lib/
│   │   ├── prisma.ts           # Prisma client singleton
│   │   ├── redis.ts            # Redis client
│   │   ├── stripe.ts           # Stripe client
│   │   ├── s3.ts               # AWS S3 helpers
│   │   ├── resend.ts           # Email client
│   │   ├── auth.ts             # NextAuth config
│   │   ├── aura.ts             # Aura AI engine
│   │   ├── socket.ts           # Socket.io server
│   │   └── translate.ts        # Language detection + translation
│   ├── hooks/
│   │   ├── useSocket.ts
│   │   ├── useStream.ts
│   │   ├── useAura.ts
│   │   └── usePayments.ts
│   ├── schemas/                # Zod schemas
│   │   ├── auth.ts
│   │   ├── stream.ts
│   │   ├── payment.ts
│   │   └── message.ts
│   └── styles/
│       └── globals.css
├── public/
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── .env.local
└── docker-compose.yml          # PostgreSQL + Redis for local dev
```

---

## Phase 1: Foundation (Next.js 14 + Prisma + Auth)

### 1A. Initialize Next.js 14 project

- `npx create-next-app@14` with App Router, TypeScript, Tailwind, ESLint
- Configure tailwind.config.ts with CYLive design tokens
- Set up globals.css with the exact color palette from spec

### 1B. Prisma Schema

Complete database schema matching the spec exactly:

- Users, Sessions, Follows, Streams, StreamPanels
- Messages, Payments, Subscriptions
- CreatorSettings, ScheduledStreams, AudioRooms
- VideoPosts, Notifications

### 1C. NextAuth.js

- Email/password (Credentials provider)
- Google OAuth
- Apple OAuth
- Session stored in DB via Prisma adapter
- JWT strategy with device info

### 1D. Design System

Build foundational UI components with the exact CYLive palette:

- accent: #FF1564 (primary CTAs, live indicators)
- gold: #FFB800 (earnings, premium, Golden Wall)
- cyan: #00F5FF (secondary actions)
- bg: #03030A, surface: #07070F, card: #0B0B18
- Full glassmorphism system

---

## Phase 2: Core Features

### 2A. Stream Infrastructure

- Studio page with RTMP key management
- Panel layout system (1-9 configurable grids)
- Stream CRUD with status management
- Integration hooks for IVS/Mux player

### 2B. Payment Infrastructure (Stripe)

- Stripe Connect onboarding for creators
- Direct tip flow (90% to creator)
- Subscription tiers (Fan $5, Supporter $10, Ride or Die $20)
- Creator tiers (Creator $19, Pro $49, Studio $149)
- Paywall gating on streams and video posts
- Webhook handler for all payment events
- Payout management

### 2C. Real-time (Socket.io)

- Chat messages with multilingual support
- Viewer count tracking
- Tip/gift notifications
- Stream status events
- Audio room signaling

---

## Phase 3: AI & Advanced Features

### 3A. Aura AI Co-host

- 4 personality modes with full system prompts
- 5 trigger events (start, tip, gift, viewer, end)
- 180-char cap per message
- 20 calls/hour/stream rate limit (Redis)
- Pro/Studio tier gating

### 3B. Multi-language Chat

- franc library for language detection
- Anthropic API for translation
- Redis caching of translations
- 12 supported display languages
- Client-side language selector

### 3C. Video Posts & Storage

- S3 pre-signed URL upload flow
- CloudFront CDN serving
- Thumbnail extraction (Sharp)
- Paywall gating on video posts

### 3D. Audio Rooms

- WebRTC via TURN server
- Socket.io signaling
- Speaker management (mute/unmute/invite/remove)
- Mixed audio stream for listeners

---

## Phase 4: Polish & Deploy

### 4A. Pages

- Browse/Explore with categories
- Watch page with embedded player + chat + Golden Wall
- Analytics dashboard
- Settings with tiered features
- Admin console
- Scheduler with notifications

### 4B. Deployment

- Vercel for Next.js app
- Railway for PostgreSQL + Redis
- Environment variable configuration
- CI/CD pipeline

---

## Execution Order (What I Build Now)

I'll start with **Phase 1** — the foundation that everything else builds on:

1. Initialize Next.js 14 project with proper configuration
2. Set up Prisma schema with the full database model
3. Configure the design system with exact CYLive tokens
4. Set up NextAuth with credentials + OAuth stubs
5. Build the authenticated shell layout
6. Port existing UI components into the new architecture
