# SwanyThree Platform

A full-stack, production-grade **AI-augmented live streaming platform** built with React + FastAPI.

## Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Frontend   | React 18, TypeScript, Vite, Tailwind CSS v3, Framer Motion |
| Backend    | FastAPI, SQLAlchemy (async), SQLite / PostgreSQL |
| Auth       | JWT (access + refresh), bcrypt via passlib      |
| Payments   | Stripe Connect (tips, subscriptions, payouts)   |
| AI         | OpenRouter API — highlight detection & NFT metadata |
| NFTs       | Polygon smart contract via Thirdweb             |
| Real-time  | WebSocket (FastAPI native)                      |
| Security   | AES-256 vault, rate limiting, CORS              |

## Pages

| Route      | Component    | Description                                   |
|------------|--------------|-----------------------------------------------|
| `/`        | Dashboard    | Platform overview, leaderboard, live activity |
| Explore    | Browse       | Stream discovery with categories              |
| Studio     | Studio       | Creator broadcast control center             |
| Watch      | Watch        | Live stream viewer with chat + tipping        |
| Insights   | Analytics    | Engagement graphs and traffic sources         |
| Finance    | Payouts      | Stripe balance and transaction ledger         |
| Vault      | NFTs         | AI-minted highlight management                |
| Settings   | Settings     | Profile, security, notifications, integrations|

## Getting Started

### Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
```

### Backend

```bash
cd backend
pip install -r requirements.txt
python main.py     # http://localhost:8000
```

### API Docs

Once the backend is running: `http://localhost:8000/docs`

## Environment Variables

Copy `backend/.env.example` → `backend/.env` and fill in:

```
SECRET_KEY=your-secret-key
STRIPE_SECRET_KEY=sk_live_...
OPENROUTER_API_KEY=sk-or-...
DATABASE_URL=sqlite+aiosqlite:///./swanythree.db
```

## Deploy

```bash
npm run deploy     # Runs Hostinger deployment script
```
