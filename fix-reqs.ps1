$SERVER_IP = "76.13.31.91"
$SERVER_USER = "root"

$REMOTE_SCRIPT = @"
    echo '[Server] Re-installing Backend dependencies...'
    cd /var/www/swanythree/backend
    
    # Activate venv and strictly install requirements
    source .venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    
    # Just in case they are missing
    pip install uvicorn fastapi sqlalchemy
    
    echo '[Server] Restarting PM2 process'
    pm2 delete swanythree-api || true
    pm2 start .venv/bin/python --name "swanythree-api" --interpreter none -- -m uvicorn main:app --host 127.0.0.1 --port 8000
    pm2 save
    
    sleep 2
    pm2 logs swanythree-api --lines 10 --nostream
"@

$REMOTE_SCRIPT = $REMOTE_SCRIPT -replace "`r", ""

Write-Host "Connecting to $SERVER_IP..."
ssh -o StrictHostKeyChecking=accept-new "${SERVER_USER}@${SERVER_IP}" $REMOTE_SCRIPT
