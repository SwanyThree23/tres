# SwanyThree Platform — Deployment Guide

## Prerequisites

- Docker Engine 24+ and Docker Compose 2.20+
- 4GB+ RAM (8GB recommended for AI services)
- Stripe account with API keys
- (Optional) OpenRouter API key for multi-model AI
- (Optional) Domain name with SSL certificate

## Quick Start (Development)

```bash
# 1. Clone and enter the repository
git clone <repo-url> && cd swanythree-platform

# 2. Run the setup script (generates secrets, starts all services)
chmod +x infrastructure/scripts/setup.sh
./infrastructure/scripts/setup.sh

# 3. Verify services are running
docker compose ps

# 4. Access the platform
# Frontend:  http://localhost:3000
# API:       http://localhost:8000
# API docs:  http://localhost:8000/docs
```

## Environment Configuration

Copy `.env.example` to `.env` and configure:

### Required Variables
```env
DATABASE_URL=postgresql+asyncpg://swanythree:password@postgres:5432/swanythree
REDIS_URL=redis://redis:6379/0
JWT_SECRET=<random-64-char-hex>
VAULT_MASTER_KEY=<random-64-char-hex>
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Optional Variables
```env
OPENROUTER_API_KEY=sk-or-...     # Multi-model AI routing
OLLAMA_BASE_URL=http://ollama:11434  # Local LLM fallback
CORS_ORIGINS=http://localhost:3000   # Comma-separated
```

## Docker Services

| Service | Port | Description |
|---------|------|-------------|
| postgres | 5432 | PostgreSQL 16 database |
| redis | 6379 | Cache, sessions, pub/sub |
| api | 8000 | FastAPI backend |
| frontend | 3000 | React development server |
| rtmp | 1935/8080 | nginx-rtmp for HLS |
| ollama | 11434 | Local LLM (Llama 3.1) |
| whisper | 9000 | Audio transcription |
| nginx | 80 | Reverse proxy |
| celery-worker | — | Background task processor |
| celery-beat | — | Scheduled task runner |

## Database Management

```bash
# Run migrations
./infrastructure/scripts/migrate.sh

# Seed with sample data
./infrastructure/scripts/seed.sh

# Access database directly
docker compose exec postgres psql -U swanythree -d swanythree
```

## Production Deployment

### 1. SSL/TLS
Place certificates at the paths referenced in nginx.conf or use Let's Encrypt:
```bash
certbot certonly --standalone -d yourdomain.com
```

### 2. Environment Hardening
```env
ENVIRONMENT=production
DEBUG=false
CORS_ORIGINS=https://yourdomain.com
```

### 3. Database Backups
```bash
# Automated daily backup
docker compose exec postgres pg_dump -U swanythree swanythree > backup_$(date +%Y%m%d).sql

# Restore from backup
docker compose exec -T postgres psql -U swanythree swanythree < backup_20240101.sql
```

### 4. Scaling Considerations
- **Horizontal**: Run multiple `api` replicas behind nginx load balancer
- **Redis**: Switch to Redis Cluster for high availability
- **Database**: Add read replicas for query-heavy workloads
- **Storage**: Cloudflare R2 for recording storage (S3-compatible)
- **CDN**: Place Cloudflare or similar in front of HLS segments

### 5. Monitoring
- Health endpoint: `GET /api/admin/health`
- Docker health checks configured for all services
- Celery Flower for task monitoring (add to compose if needed)

## Kubernetes (Optional)

Kubernetes manifests are available in `infrastructure/k8s/` for production deployments requiring orchestration, auto-scaling, and rolling updates.

## Troubleshooting

**Services won't start**: Check Docker daemon is running and ports aren't in use.
```bash
docker compose logs <service-name>
```

**Database connection errors**: Ensure postgres health check passes before api starts.
```bash
docker compose exec postgres pg_isready -U swanythree
```

**RTMP not working**: Verify port 1935 is accessible and OBS is configured with the correct stream key.

**AI services slow on first run**: Ollama needs to pull the model (~4GB). Check:
```bash
docker compose logs ollama
```
