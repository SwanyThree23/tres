#!/bin/sh
set -e

echo "▶ Running database migrations..."
cd /app && python -m alembic -c backend/alembic.ini upgrade head

echo "▶ Starting API server..."
exec "$@"
