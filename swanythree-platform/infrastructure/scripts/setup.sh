#!/bin/bash
set -euo pipefail

echo "══════════════════════════════════════════════════════════════"
echo "  SwanyThree Platform — First-Time Setup"
echo "══════════════════════════════════════════════════════════════"

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "ERROR: Docker Compose is not installed."
    exit 1
fi

# Create .env from example if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env

    # Generate secure random values
    SECRET_KEY=$(openssl rand -hex 32)
    VAULT_MASTER_KEY=$(openssl rand -hex 32)
    DB_PASSWORD=$(openssl rand -hex 16)

    # Replace placeholder values
    sed -i "s/SECRET_KEY=CHANGE-ME.*/SECRET_KEY=${SECRET_KEY}/" .env
    sed -i "s/VAULT_MASTER_KEY=CHANGE-ME.*/VAULT_MASTER_KEY=${VAULT_MASTER_KEY}/" .env
    sed -i "s/DB_PASSWORD=CHANGE-ME.*/DB_PASSWORD=${DB_PASSWORD}/" .env
    sed -i "s|DATABASE_URL=.*|DATABASE_URL=postgresql+asyncpg://st3user:${DB_PASSWORD}@postgres:5432/swanythree|" .env

    echo "Generated secure keys in .env"
else
    echo ".env already exists, skipping..."
fi

# Pull Docker images
echo ""
echo "Pulling Docker images..."
docker compose pull

# Start core services first
echo ""
echo "Starting PostgreSQL and Redis..."
docker compose up -d postgres redis
echo "Waiting for services to be healthy..."
sleep 8

# Start all remaining services
echo ""
echo "Starting all services..."
docker compose up -d

# Pull default Ollama model
echo ""
echo "Pulling default Ollama model (llama3.2:3b)..."
docker exec st3-ollama ollama pull llama3.2:3b 2>/dev/null || echo "Ollama model pull deferred (service may still be starting)"

echo ""
echo "══════════════════════════════════════════════════════════════"
echo "  SwanyThree is running!"
echo ""
echo "  Frontend:    http://localhost:3000"
echo "  API:         http://localhost:8000"
echo "  API Docs:    http://localhost:8000/docs"
echo "  RTMP Ingest: rtmp://localhost:1935/live"
echo "══════════════════════════════════════════════════════════════"
