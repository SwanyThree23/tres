<#
.SYNOPSIS
Deploys the CYLive API to the VPS.

.DESCRIPTION
This script automates the deployment process:
1. Compiles the TypeScript application.
2. Archives the necessary build files (dist, package.json, prisma schema, mediamtx.yml).
3. Transfers the archive to the VPS via SCP.
4. Connects via SSH to extract, install prod deps, and restart the PM2 process.
#>

$ErrorActionPreference = "Stop"

# =====================================================================
# Configuration 
# =====================================================================
$SERVER_USER = "root"
$SERVER_IP = "76.13.31.91"
$SERVER_DIR = "/var/www/cylive-api"
$ARCHIVE_NAME = "cylive_api_release.tar.gz"

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "🚀 Starting CY Live API Deployment to $SERVER_IP" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan

# 1. Build the Application
Write-Host "`n[1/5] Building Node.js Application..." -ForegroundColor Yellow
Set-Location -Path ".\apps\api"

Write-Host "      Generating Prisma client..."
npx prisma generate
if ($LASTEXITCODE -ne 0) { throw "Prisma generate failed!" }

Write-Host "      Compiling TypeScript..."
npm run build
if ($LASTEXITCODE -ne 0) { throw "TypeScript build failed!" }

Set-Location -Path "..\.."

# 2. Package the Release
Write-Host "`n[2/5] Creating release archive ($ARCHIVE_NAME)..." -ForegroundColor Yellow
if (Test-Path $ARCHIVE_NAME) { Remove-Item $ARCHIVE_NAME -Force }

# Create a temporary staging directory
$STAGING_DIR = Join-Path $env:TEMP "cylive_api_staging"
if (Test-Path $STAGING_DIR) { Remove-Item $STAGING_DIR -Recurse -Force }
New-Item -ItemType Directory -Path $STAGING_DIR | Out-Null

Write-Host "      Copying build files..."
New-Item -ItemType Directory -Path "$STAGING_DIR\apps\api" | Out-Null
Copy-Item -Path ".\apps\api\dist" -Destination "$STAGING_DIR\apps\api\dist" -Recurse -Force
Copy-Item -Path ".\apps\api\package.json" -Destination "$STAGING_DIR\apps\api\" -Force
Copy-Item -Path ".\apps\api\package-lock.json" -Destination "$STAGING_DIR\apps\api\" -Force
Copy-Item -Path ".\ecosystem.config.cjs" -Destination "$STAGING_DIR\" -Force
Copy-Item -Path ".\mediamtx.yml" -Destination "$STAGING_DIR\" -Force

New-Item -ItemType Directory -Path "$STAGING_DIR\apps\api\src" | Out-Null
Copy-Item -Path ".\apps\api\src\prisma" -Destination "$STAGING_DIR\apps\api\src\prisma" -Recurse -Force

# Create tar.gz archive
Write-Host "      Compressing files..."
Set-Location -Path $STAGING_DIR
tar -czf "..\$ARCHIVE_NAME" *
if ($LASTEXITCODE -ne 0) { throw "Tar compression failed!" }
Set-Location -Path ".."

# Cleanup staging
Remove-Item $STAGING_DIR -Recurse -Force

# 3. Transfer to VPS
Write-Host "`n[3/5] Transferring archive to VPS via SCP..." -ForegroundColor Yellow
scp -o StrictHostKeyChecking=accept-new $env:TEMP\$ARCHIVE_NAME "${SERVER_USER}@${SERVER_IP}:/tmp/$ARCHIVE_NAME"
if ($LASTEXITCODE -ne 0) { throw "SCP transfer failed!" }

# 4. Execute Remote Commands
Write-Host "`n[4/5] Executing remote setup on the server..." -ForegroundColor Yellow
$REMOTE_SCRIPT = @"
    echo '[Server] Ensuring API directory exists at $SERVER_DIR'
    mkdir -p $SERVER_DIR
    
    echo '[Server] Extracting application files...'
    tar -xzf /tmp/$ARCHIVE_NAME -C $SERVER_DIR
    rm -f /tmp/$ARCHIVE_NAME

    echo '[Server] Installing Production Dependencies & Generating Prisma Client...'
    cd $SERVER_DIR/apps/api
    npm ci --omit=dev
    npx prisma generate
    cd $SERVER_DIR

    echo '[Server] Ensuring PM2 logrotate is installed...'
    pm2 install pm2-logrotate || true
    pm2 set pm2-logrotate:max_size 50M
    pm2 set pm2-logrotate:retain 30
    pm2 set pm2-logrotate:compress true

    echo '[Server] Restarting application via PM2...'
    # If using Docker for Postgres/Redis/MediaMTX, they should be started separately
    pm2 restart ecosystem.config.cjs --update-env || pm2 start ecosystem.config.cjs
    pm2 save
    
    echo '[Server] Deployment completed successfully.'
"@

$REMOTE_SCRIPT = $REMOTE_SCRIPT -replace "`r", ""
ssh -o StrictHostKeyChecking=accept-new "${SERVER_USER}@${SERVER_IP}" $REMOTE_SCRIPT
if ($LASTEXITCODE -ne 0) { throw "Remote script execution failed!" }

# 5. Cleanup Local Build Artifacts
Write-Host "`n[5/5] Cleaning up local artifacts..." -ForegroundColor Yellow
if (Test-Path "$env:TEMP\$ARCHIVE_NAME") { Remove-Item "$env:TEMP\$ARCHIVE_NAME" -Force }

Write-Host "`n✅ CY Live API Deployment Complete!" -ForegroundColor Green
