$SERVER_IP = "76.13.31.91"
$SERVER_USER = "root"

$REMOTE_SCRIPT = @"
    echo '[Server] Stopping and removing previous PM2 process...'
    pm2 delete swanythree-api || true
    
    cd /var/www/swanythree/backend
    
    echo '[Server] Starting API engine correctly...'
    # Use the python binary inside the venv directly with the module flag
    pm2 start .venv/bin/python --name "swanythree-api" --interpreter none -- -m uvicorn main:app --host 127.0.0.1 --port 8000
    pm2 save
    
    sleep 2
    echo '[Server] API Log Preview:'
    pm2 logs swanythree-api --lines 20 --nostream
"@

$REMOTE_SCRIPT = $REMOTE_SCRIPT -replace "`r", ""

Write-Host "Connecting to $SERVER_IP..."
ssh -o StrictHostKeyChecking=accept-new "${SERVER_USER}@${SERVER_IP}" $REMOTE_SCRIPT
