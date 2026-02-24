<#
.SYNOPSIS
Deploys the SwanyThree platform to a Hostinger VPS.

.DESCRIPTION
This script automates the deployment process:
1. Compiles the React/Vite frontend.
2. Archives the necessary frontend build and backend Python files.
3. Transfers the archive to the VPS via SCP.
4. Connects via SSH to extract, install dependencies, and restart the PM2 process.

.NOTES
Requirements:
- OpenSSH client installed on Windows.
- SSH Key authentication configured for passwordless login (recommended) OR prompt for password.
- PM2 installed globally on the VPS.
#>

$ErrorActionPreference = "Stop"

# =====================================================================
# Configuration — Edit these variables for your specific Hostinger VPS
# =====================================================================
$SERVER_USER = "root"
$SERVER_IP = "72.60.165.129" # seewhylive.com production IP
$SERVER_DIR = "/var/www/swanythree"
$PM2_APP_NAME = "swanythree-api"
$ARCHIVE_NAME = "swanythree_release.tar.gz"

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "🚀 Starting SwanyThree Deployment to $SERVER_IP" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan

# 1. Build the Frontend
Write-Host "`n[1/5] Building Frontend (Vite/React)..." -ForegroundColor Yellow
Set-Location -Path ".\frontend"
npm install    # <-- ensures all devDependencies required for Vite/TS are present
if ($LASTEXITCODE -ne 0) { throw "Frontend npm install failed!" }
npm run build
if ($LASTEXITCODE -ne 0) { throw "Frontend build failed!" }
Set-Location -Path ".."

# 2. Package the Release
Write-Host "`n[2/5] Creating release archive ($ARCHIVE_NAME)..." -ForegroundColor Yellow
# Remove old archive if it exists
if (Test-Path $ARCHIVE_NAME) { Remove-Item $ARCHIVE_NAME -Force }

# Create a temporary staging directory
$STAGING_DIR = "release_staging"
if (Test-Path $STAGING_DIR) { Remove-Item $STAGING_DIR -Recurse -Force }
New-Item -ItemType Directory -Path $STAGING_DIR | Out-Null

# Copy frontend build
Write-Host "      Copying frontend build..."
Copy-Item -Path ".\frontend\dist" -Destination "$STAGING_DIR\frontend\dist" -Recurse -Force

# Copy backend files (excluding venv, cache, etc)
Write-Host "      Copying backend code..."
New-Item -ItemType Directory -Path "$STAGING_DIR\backend" | Out-Null
$backendItems = Get-ChildItem -Path ".\backend" -Exclude ".venv", "__pycache__", "*.db", ".pytest_cache"
foreach ($item in $backendItems) {
    Copy-Item -Path $item.FullName -Destination "$STAGING_DIR\backend" -Recurse -Force
}

# Create tar.gz archive using built-in Windows tar
Write-Host "      Compressing files..."
Set-Location -Path $STAGING_DIR
tar -czf "..\$ARCHIVE_NAME" *
Set-Location -Path ".."

# Cleanup staging
Remove-Item $STAGING_DIR -Recurse -Force

# 3. Transfer to VPS
Write-Host "`n[3/5] Transferring archive to VPS via SCP..." -ForegroundColor Yellow
scp -o StrictHostKeyChecking=accept-new $ARCHIVE_NAME "${SERVER_USER}@${SERVER_IP}:/tmp/$ARCHIVE_NAME"
if ($LASTEXITCODE -ne 0) { throw "SCP transfer failed!" }

# 4. Execute Remote Commands
Write-Host "`n[4/5] Executing remote setup on the server..." -ForegroundColor Yellow
$REMOTE_SCRIPT = @"
    echo '[Server] Ensuring application directory exists at $SERVER_DIR'
    mkdir -p $SERVER_DIR
    
    echo '[Server] Extracting application files...'
    tar -xzf /tmp/$ARCHIVE_NAME -C $SERVER_DIR
    rm -f /tmp/$ARCHIVE_NAME

    echo '[Server] Installing/Updating Python dependencies...'
    cd $SERVER_DIR/backend
    
    # Create venv if it doesn't exist
    if [ ! -d ".venv" ]; then
        python3 -m venv .venv
    fi
    source .venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    
    echo '[Server] Restarting API via PM2...'
    # Assumes PM2 was previously started via:
    # pm2 start main.py --name "swanythree-api" --interpreter ./venv/bin/python
    pm2 restart $PM2_APP_NAME || echo 'PM2 application not found, please start it manually first.'
    
    echo '[Server] Deployment completed successfully.'
"@

# Fix Windows CRLF line endings for Linux bash
$REMOTE_SCRIPT = $REMOTE_SCRIPT -replace "`r", ""
ssh -o StrictHostKeyChecking=accept-new "${SERVER_USER}@${SERVER_IP}" $REMOTE_SCRIPT
if ($LASTEXITCODE -ne 0) { throw "Remote script execution failed!" }

# 5. Cleanup Local Build Artifacts
Write-Host "`n[5/5] Cleaning up local artifacts..." -ForegroundColor Yellow
if (Test-Path $ARCHIVE_NAME) { Remove-Item $ARCHIVE_NAME -Force }

Write-Host "`n✅ SwanyThree Deployment Complete!" -ForegroundColor Green
Write-Host "Don't forget to configure Nginx on the server to point to $SERVER_DIR/frontend/dist and proxy /api to localhost:8000." -ForegroundColor Cyan
