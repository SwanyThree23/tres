<#
.SYNOPSIS
Deploys the CYLive Next.js monolith to a Hostinger VPS.

.DESCRIPTION
This script automates the deployment process:
1. Compiles the Next.js application in standalone mode.
2. Archives the necessary standalone build files.
3. Transfers the archive to the VPS via SCP.
4. Connects via SSH to extract and restart the PM2 process.

.NOTES
Requirements:
- OpenSSH client installed on Windows.
- SSH Key authentication configured for passwordless login.
- PM2 installed globally on the VPS.
#>

$ErrorActionPreference = "Stop"

# =====================================================================
# Configuration — Edit these variables for your specific Hostinger VPS
# =====================================================================
$SERVER_USER = "root"
$SERVER_IP = "72.60.165.129" # seewhylive.com production IP
$SERVER_DIR = "/var/www/cylive"
$PM2_APP_NAME = "cylive-app"
$ARCHIVE_NAME = "cylive_release.tar.gz"

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "🚀 Starting CYLive Deployment to $SERVER_IP" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan

# 1. Build the Application
Write-Host "`n[1/5] Building Next.js Application (Standalone)..." -ForegroundColor Yellow
Set-Location -Path ".\cylive"

# Run prisma generate to ensure client is ready
Write-Host "      Generating Prisma client..."
npx prisma generate
if ($LASTEXITCODE -ne 0) { throw "Prisma generate failed!" }

npm install
if ($LASTEXITCODE -ne 0) { throw "npm install failed!" }

npm run build
if ($LASTEXITCODE -ne 0) { throw "Next.js build failed!" }
Set-Location -Path ".."

# 2. Package the Release
Write-Host "`n[2/5] Creating release archive ($ARCHIVE_NAME)..." -ForegroundColor Yellow
if (Test-Path $ARCHIVE_NAME) { Remove-Item $ARCHIVE_NAME -Force }

# Create a temporary staging directory
$STAGING_DIR = Join-Path $env:TEMP "cylive_release_staging"
if (Test-Path $STAGING_DIR) { Remove-Item $STAGING_DIR -Recurse -Force }
New-Item -ItemType Directory -Path $STAGING_DIR | Out-Null

# Copy standalone build files
Write-Host "      Copying standalone build..."
# Standalone folder contains the server.js and a minimal node_modules
Copy-Item -Path ".\cylive\.next\standalone\*" -Destination "$STAGING_DIR" -Recurse -Force
# Next.js standalone requires .next/static and public to be copied manually
New-Item -ItemType Directory -Path "$STAGING_DIR\.next\static" -Force | Out-Null
Copy-Item -Path ".\cylive\.next\static\*" -Destination "$STAGING_DIR\.next\static" -Recurse -Force
Copy-Item -Path ".\cylive\public" -Destination "$STAGING_DIR\public" -Recurse -Force

# Create tar.gz archive
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

    echo '[Server] Restarting application via PM2...'
    cd $SERVER_DIR
    # Start or restart the standalone server
    # Note: PORT env var can be set here if needed
    pm2 delete $PM2_APP_NAME || true
    PORT=3000 pm2 start server.js --name "$PM2_APP_NAME"
    
    echo '[Server] Deployment completed successfully.'
"@

$REMOTE_SCRIPT = $REMOTE_SCRIPT -replace "`r", ""
ssh -o StrictHostKeyChecking=accept-new "${SERVER_USER}@${SERVER_IP}" $REMOTE_SCRIPT
if ($LASTEXITCODE -ne 0) { throw "Remote script execution failed!" }

# 5. Cleanup Local Build Artifacts
Write-Host "`n[5/5] Cleaning up local artifacts..." -ForegroundColor Yellow
if (Test-Path $ARCHIVE_NAME) { Remove-Item $ARCHIVE_NAME -Force }

Write-Host "`n✅ CYLive Deployment Complete!" -ForegroundColor Green
Write-Host "Application is running via PM2. Ensure Nginx is proxying to port 3000." -ForegroundColor Cyan
