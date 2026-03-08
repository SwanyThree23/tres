#!/bin/bash
set -euo pipefail
echo "Running Alembic migrations..."
cd /app
alembic upgrade head
echo "Migrations complete."
