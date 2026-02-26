# =====================================================================
# swanythree-deploy.ps1
# Full-Stack Deployment for SwanyThree (Next.js + FastAPI)
# =====================================================================

$ErrorActionPreference = "Stop"

# --- Configuration ---
$SERVER_USER = "root"
$SERVER_IP = "72.60.165.129"
$CYLIVE_DIR = "/var/www/swanythree/cylive"
$BACKEND_DIR = "/var/www/swanythree/backend"
$ARCHIVE_NAME = "swanythree_full_release.tar.gz"

# Secrets (Should be managed via environment variables in a real CI/CD)
$NEXTAUTH_SECRET = "production-secret-98723498127349127394812"

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "🚀 Starting Full-Stack Deployment to $SERVER_IP" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan

# 1. Build Next.js (CYLive)
Write-Host "`n[1/5] Building Next.js Application (CYLive)..." -ForegroundColor Yellow
Set-Location -Path ".\cylive"
Write-Host "      Generating Prisma client..."
npx prisma generate
Write-Host "      Installing dependencies..."
npm install
Write-Host "      Running build..."
npm run build
Set-Location -Path ".."

# 2. Package the Release
Write-Host "`n[2/5] Packaging Release Artifacts (Frontend + Backend)..." -ForegroundColor Yellow
$STAGING_DIR = Join-Path $env:TEMP "swanythree_staging"
if (Test-Path $STAGING_DIR) { Remove-Item $STAGING_DIR -Recurse -Force }
New-Item -ItemType Directory -Path $STAGING_DIR | Out-Null

# Create subdirectories for staging
$STAGING_FRONTEND = New-Item -ItemType Directory -Path (Join-Path $STAGING_DIR "cylive")
$STAGING_BACKEND = New-Item -ItemType Directory -Path (Join-Path $STAGING_DIR "backend")

# Frontend Artifacts (Standalone build)
Write-Host "      Copying CYLive standalone build..."
Copy-Item -Path ".\cylive\.next\standalone\*" -Destination $STAGING_FRONTEND.FullName -Recurse -Force
New-Item -ItemType Directory -Path (Join-Path $STAGING_FRONTEND.FullName ".next\static") -Force | Out-Null
Copy-Item -Path ".\cylive\.next\static\*" -Destination (Join-Path $STAGING_FRONTEND.FullName ".next\static") -Recurse -Force
Copy-Item -Path ".\cylive\public" -Destination (Join-Path $STAGING_FRONTEND.FullName "public") -Recurse -Force
Copy-Item -Path ".\cylive\prisma" -Destination (Join-Path $STAGING_FRONTEND.FullName "prisma") -Recurse -Force

# Backend Artifacts
Write-Host "      Copying Backend source..."
Copy-Item -Path ".\backend\*" -Destination $STAGING_BACKEND.FullName -Recurse -Force -Exclude ".venv", "__pycache__", "*.db"

# Create final archive
Write-Host "      Compressing full release..."
Set-Location -Path $STAGING_DIR
tar -czf "..\$ARCHIVE_NAME" .
Set-Location -Path ".."
Remove-Item $STAGING_DIR -Recurse -Force

# 3. Transfer to VPS
Write-Host "`n[3/5] Transferring archive to VPS via SCP..." -ForegroundColor Yellow
scp -o StrictHostKeyChecking=accept-new $ARCHIVE_NAME "${SERVER_USER}@${SERVER_IP}:/tmp/$ARCHIVE_NAME"
if ($LASTEXITCODE -ne 0) { throw "SCP transfer failed!" }

# 4. Remote Execution
Write-Host "`n[4/5] Executing remote configuration and restart..." -ForegroundColor Yellow
$REMOTE_SCRIPT = @"
    # Setup base directory
    mkdir -p /var/www/swanythree
    mkdir -p $CYLIVE_DIR
    mkdir -p $BACKEND_DIR

    echo '[Server] Extracting release...'
    tar -xzf /tmp/$ARCHIVE_NAME -C /var/www/swanythree/
    rm -f /tmp/$ARCHIVE_NAME

    # ── Nginx Setup ──
    echo '[Server] Updating Nginx configuration...'
    cat > /etc/nginx/sites-available/swanythree <<EOF
server {
    listen 80;
    server_name seewhylive.com $SERVER_IP;

    # Handle Next.js (CYLive) Frontend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # Handle FastAPI Backend
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /docs {
        proxy_pass http://127.0.0.1:8000/docs;
    }
}
EOF
    ln -sf /etc/nginx/sites-available/swanythree /etc/nginx/sites-enabled/swanythree
    rm -f /etc/nginx/sites-enabled/default
    nginx -t && systemctl restart nginx

    # ── PM2 Restart (CYLive) ──
    echo '[Server] Restarting CYLive (Next.js)...'
    cd $CYLIVE_DIR
    pm2 delete cylive-app || true
    PORT=3000 \
    NEXTAUTH_SECRET="$NEXTAUTH_SECRET" \
    NEXTAUTH_URL="http://seewhylive.com" \
    DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cylive?schema=public" \
    REDIS_URL="redis://localhost:6379" \
    pm2 start server.js --name "cylive-app"

    # ── PM2 Restart (Backend) ──
    echo '[Server] Restarting SwanyThree API...'
    cd $BACKEND_DIR
    # Ensure venv exists and requirements are installed
    if [ ! -d ".venv" ]; then
        python3 -m venv .venv
    fi
    .venv/bin/pip install -r requirements.txt
    
    pm2 delete swanythree-api || true
    # Start via venv python
    pm2 start .venv/bin/python --name "swanythree-api" --interpreter none -- -m uvicorn main:app --host 127.0.0.1 --port 8000

    pm2 save
    echo '[Server] Deployment complete!'
"@

$REMOTE_SCRIPT = $REMOTE_SCRIPT -replace "`r", ""
ssh -o StrictHostKeyChecking=accept-new "${SERVER_USER}@${SERVER_IP}" $REMOTE_SCRIPT
if ($LASTEXITCODE -ne 0) { throw "Remote script execution failed!" }

# 5. Cleanup Local Artifact
Write-Host "`n[5/5] Cleaning up local archive..." -ForegroundColor Yellow
if (Test-Path $ARCHIVE_NAME) { Remove-Item $ARCHIVE_NAME -Force }

Write-Host "`n✅ Full-Stack Deployment Complete!" -ForegroundColor Green
Write-Host "Access at: http://seewhylive.com/ or http://$SERVER_IP/" -ForegroundColor Cyan
