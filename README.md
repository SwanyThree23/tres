# SwanyThree Production Platform

Full-stack streaming platform with 20-guest panels, 90/10 revenue split, individual guest destinations, embeddable player, and synchronized watch parties.

## Architecture

- **Backend:** Node.js/TypeScript + Express + Socket.IO
- **Frontend:** React/TypeScript + Vite + Tailwind CSS
- **AI Layer:** LLMLingua (compression) + OpenRouter (intelligence) + SwanyBot (moderation)
- **Streaming:** WebRTC (interaction) + FFmpeg (RTMP fanout) + NGINX-RTMP (ingest)
- **Security:** SwanyThree Vault Pro (AES-256-GCM)
- **Data:** MongoDB + Redis

## Core Features

1. **20-Guest Expandable Panel** - WebRTC-based grid with spotlight mode
2. **90/10 Revenue Split** - Hardcoded payment processing (90% creator, 10% platform)
3. **Individual Guest Destinations** - Per-guest RTMP fanout to YouTube, Twitch, etc.
4. **Embeddable Player** - RTMP ingest server with iframe embed code generation
5. **Watch Party** - Synchronized media playback with host controls

## Project Structure

```
tres/
├── backend/
│   └── src/
│       ├── server.ts                 # Main gateway server
│       ├── services/
│       │   ├── SwanyAIWrapper.ts      # LLMLingua + OpenRouter + Wisprflow
│       │   ├── GuestStreamingManager.ts  # FFmpeg RTMP fanout
│       │   └── PaymentProcessor.ts    # 90/10 split engine
│       ├── utils/
│       │   └── vault.ts              # AES-256-GCM encryption
│       └── workers/
│           └── swanybot.ts           # Chat moderation worker
├── frontend/
│   └── src/
│       ├── App.tsx
│       ├── components/
│       │   ├── SwanyThreeStudio.tsx   # Main studio layout
│       │   ├── WatchParty.tsx         # Synchronized player
│       │   ├── GuestPanel.tsx         # 20-guest grid
│       │   ├── ChatPanel.tsx          # Live chat with SwanyBot
│       │   └── EmbedModal.tsx         # Embed code generator
│       └── hooks/
│           └── useSocket.ts          # Socket.IO hook
├── infrastructure/
│   └── beta-agreement.json           # Beta tester terms
└── docker-compose.yml                # Full stack deployment
```

## Setup

1. Copy `backend/.env.example` to `backend/.env` and fill in credentials
2. Run the stack:

```bash
docker-compose up --build
```

Or for local development:

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend
cd frontend && npm install && npm run dev
```

## Environment Variables

See `backend/.env.example` for the full list of required environment variables.

## License

MIT
