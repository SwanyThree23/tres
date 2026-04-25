# 📺 CYLive — Next-Gen Creator Command Center

**CYLive** is a high-performance, full-stack live-streaming platform designed for the modern creator economy. It combines professional-grade broadcasting tools with AI-driven engagement and instant monetization.

---

## 🚀 Key Features

### 🤖 Aura AI Co-Host
Experience the industry's first context-aware AI co-host. Aura listens to your stream, reacts to tips, and engages with your audience in real-time.
- **4 Personality Modes**: SASSY, HYPE, CALM, and KIND.
- **Trigger Events**: Reacts to stream starts, viewer joins, and donations.
- **@aura Command**: Direct interaction via chat commands.

### ⚡ Real-Time Infrastructure
Powered by **Socket.IO**, CYLive delivers a zero-latency experience for interactive features.
- **Instant Chat**: WebSocket-driven communication across the platform.
- **Live State Sync**: Real-time updates for viewer counts, stream status, and panel roles.
- **Multi-Panel Streaming**: Support for up to 9 panels with real-time director control.

### 💰 Monetization & Marketplace
- **Content Market**: Creators can upload high-quality video posts with integrated paywalls.
- **Instant Tipping**: Stripe-powered donations with automated platform fee handling (90/10 split).
- **Creator Tiers**: Access control based on subscription levels (FREE, PRO, STUDIO).

### 🛡️ Admin Overlord Terminal
A centralized command center for platform governance.
- **Platform Analytics**: Real-time monitoring of revenue, active streamers, and user growth.
- **Moderation Engine**: Tools for banning, timing out, and message enforcement.
- **System Security**: Automated alerts for suspicious transactions and flagged content.

---

## 🛠️ Technical Stack

- **Core**: [Next.js 14](https://nextjs.org/) (App Router & Pages Router hybrid)
- **Real-time**: [Socket.IO](https://socket.io/)
- **Database**: [Prisma](https://www.prisma.io/) + PostgreSQL
- **AI Engine**: [Anthropic Claude Sonnet 4](https://www.anthropic.com/)
- **Payments**: [Stripe](https://stripe.com/)
- **Styling**: Vanilla CSS with modern Glassmorphism aesthetics
- **Animations**: [Framer Motion](https://www.framer.com/motion/)

---

## 🏁 Getting Started

### 1. Environment Setup
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your_secret"
STRIPE_SECRET_KEY="sk_test_..."
ANTHROPIC_API_KEY="sk-ant-..."
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Migration
```bash
npx prisma db push
```

### 4. Run Development Server
```bash
npm run dev
```

---

## 📊 Development Status

Current Version: **v4.0 (Full Stack Integrated)**
- [x] Socket.IO Provider & Real-time Chat
- [x] Admin Governance Dashboard
- [x] Aura AI Co-Host Engine
- [x] Marketplace Uploads & Paywalls
- [ ] RTMP Ingest Integration (Planned)
- [ ] Mobile-native App (Planned)

---

Developed with ❤️ by the **Antigravity** Team.
