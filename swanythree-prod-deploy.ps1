# =====================================================================
# swanythree-final-deploy.ps1
# Production-Ready Deployment for SwanyThree (CYLive + FastAPI)
# =====================================================================

$ErrorActionPreference = "Stop"

# --- Configuration ---
$SERVER_USER = "root"
$SERVER_IP = "72.60.165.129"
$BASE_DIR = "/var/www/swanythree"
$CYLIVE_DIR = "$BASE_DIR/cylive"
$BACKEND_DIR = "$BASE_DIR/backend"
$ARCHIVE_NAME = "swanythree_production.tar.gz"

# Secrets
$NEXTAUTH_SECRET = "j3k4h5k6l7m8n9o0p1q2r3s4t5u6v7w8x9y0z1a2b3c4d5"
$BACKEND_SECRET = "production-backend-secret-a98b7c6d5e4f3g2h1"
$VAULT_KEY = "YmFzZTY0LWVuY29kZWQtMzItYnl0ZS1rZXktZ28="

Write-Host "=====================================================" -ForegroundColor Green
Write-Host "🚀 DEPLOYING SWANYTHREE TO PRODUCTION ($SERVER_IP)" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green

# 1. Build Frontend
Write-Host "`n[1/5] Building Next.js Frontend (Standalone)..." -ForegroundColor Yellow
Set-Location -Path ".\cylive"
npx prisma generate
npm install
npm run build
Set-Location -Path ".."

# 2. Package
Write-Host "`n[2/5] Packaging Assets..." -ForegroundColor Yellow
$STAGING = Join-Path $env:TEMP "swany_prod_staging"
if (Test-Path $STAGING) { Remove-Item $STAGING -Recurse -Force }
New-Item -ItemType Directory -Path $STAGING | Out-Null
New-Item -ItemType Directory -Path "$STAGING/cylive" | Out-Null
New-Item -ItemType Directory -Path "$STAGING/backend" | Out-Null

# Frontend artifacts
Copy-Item -Path ".\cylive\.next\standalone\*" -Destination "$STAGING/cylive" -Recurse -Force
New-Item -ItemType Directory -Path "$STAGING/cylive/.next/static" -Force | Out-Null
Copy-Item -Path ".\cylive\.next\static\*" -Destination "$STAGING/cylive/.next/static" -Recurse -Force
Copy-Item -Path ".\cylive/public" -Destination "$STAGING/cylive/public" -Recurse -Force
Copy-Item -Path ".\cylive/prisma" -Destination "$STAGING/cylive/prisma" -Recurse -Force

# Backend artifacts
Copy-Item -Path ".\backend\*" -Destination "$STAGING/backend" -Recurse -Force -Exclude ".venv", "__pycache__", "*.db", ".env"

# Create archive
Set-Location -Path $STAGING
tar -czf "..\$ARCHIVE_NAME" .
Set-Location -Path ".."
Remove-Item $STAGING -Recurse -Force

# 3. Transfer
Write-Host "`n[3/5] Transferring to Server..." -ForegroundColor Yellow
scp -o StrictHostKeyChecking=accept-new $ARCHIVE_NAME "${SERVER_USER}@${SERVER_IP}:/tmp/$ARCHIVE_NAME"

# 4. Remote Setup
Write-Host "`n[4/5] Running Remote Configuration..." -ForegroundColor Yellow
$REMOTE_SCRIPT = @"
    # Setup Database (if missing)
    echo '[DB] Checking database...'
    sudo -u postgres psql -c "CREATE DATABASE cylive;" || true
    sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';" || true
    
    # Extract
    mkdir -p $BASE_DIR
    echo '[FS] Extracting files...'
    tar -xzf /tmp/$ARCHIVE_NAME -C $BASE_DIR
    rm -f /tmp/$ARCHIVE_NAME

    # ── Environment Files ──
    echo '[ENV] Writing .env files...'
    
    # Frontend ENV
    cat > $CYLIVE_DIR/.env <<EOF
PORT=3000
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
NEXTAUTH_URL=http://seewhylive.com
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cylive?schema=public
REDIS_URL=redis://localhost:6379
NODE_ENV=production
EOF

    # Backend ENV
    cat > $BACKEND_DIR/.env <<EOF
ENV=production
SECRET_KEY=$BACKEND_SECRET
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/cylive
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/1
API_PORT=8000
VAULT_MASTER_KEY=$VAULT_KEY
OLLAMA_URL=http://localhost:11434
WHISPER_URL=http://localhost:8001
DEFAULT_LLM_MODEL=llama3.2:3b
EOF

    # ── PM2 Re-Start ──
    echo '[PM2] Restarting processes...'
    
    # Frontend
    cd $CYLIVE_DIR
    pm2 delete cylive-app || true
    pm2 start server.js --name "cylive-app"
    
    # Backend
    cd $BACKEND_DIR
    if [ ! -d ".venv" ]; then python3 -m venv .venv; fi
    .venv/bin/pip install -r requirements.txt
    pm2 delete swanythree-api || true
    pm2 start .venv/bin/python --name "swanythree-api" --interpreter none -- -m uvicorn main:app --host 127.0.0.1 --port 8000

    pm2 save
    echo '[Ready] All services updated.'
"@

$REMOTE_SCRIPT = $REMOTE_SCRIPT -replace "`r", ""
ssh -o StrictHostKeyChecking=accept-new "${SERVER_USER}@${SERVER_IP}" $REMOTE_SCRIPT

# 5. Cleanup
if (Test-Path $ARCHIVE_NAME) { Remove-Item $ARCHIVE_NAME -Force }

Write-Host "`n✅ DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
Write-Host "Site: http://seewhylive.com" -ForegroundColor Cyan
