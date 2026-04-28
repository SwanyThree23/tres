#!/usr/bin/env bash
set -euo pipefail

echo "🔧 SeeWhy LIVE — Setup Script"
echo "================================"

# Generate secrets
SECRET_KEY=$(openssl rand -hex 32)
DB_PASSWORD=$(openssl rand -hex 16)

# Write .env
cat > .env <<EOF
# App
ENVIRONMENT=production
DEBUG=false

# Security
SECRET_KEY=${SECRET_KEY}

# Database
DB_PASSWORD=${DB_PASSWORD}
DATABASE_URL=postgresql+asyncpg://seewhy:${DB_PASSWORD}@postgres:5432/seewhy

# Redis
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/1

# AI (optional but recommended)
ANTHROPIC_API_KEY=

# Stripe (optional)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Cloudflare R2 (optional)
R2_ACCOUNT_ID=
R2_ACCESS_KEY=
R2_SECRET_KEY=
R2_BUCKET=seewhy-recordings
R2_PUBLIC_URL=
EOF

echo "✅ .env file created"
echo ""
echo "📦 Pulling Docker images..."
docker compose pull

echo ""
echo "🚀 Starting services..."
docker compose up -d

echo ""
echo "⏳ Waiting for database..."
sleep 5

echo ""
echo "🗄️  Running database migrations..."
docker compose exec api python -c "
import asyncio
from backend.core.database import init_db
asyncio.run(init_db())
print('Database initialized.')
"

echo ""
echo "✅ SeeWhy LIVE is running!"
echo ""
echo "   Frontend: http://localhost"
echo "   API docs: http://localhost/api/docs"
echo "   RTMP ingest: rtmp://localhost:1935/live"
echo ""
echo "🔑 Your secrets are saved in .env — keep them safe!"
