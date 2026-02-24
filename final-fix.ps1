$SERVER_IP = "76.13.31.91"
$SERVER_USER = "root"

$REMOTE_SCRIPT = @"
    echo '[Server] Forcing literal pip installs into the .venv...'
    cd /var/www/swanythree/backend
    
    # Use the literal path to the venv python to be 100% sure it installs there
    .venv/bin/python -m pip install --upgrade pip
    .venv/bin/python -m pip install -r requirements.txt
    
    # Restart the background process
    pm2 restart swanythree-api
    
    # Give it a second
    sleep 2
    
    # Read the logs
    pm2 logs swanythree-api --lines 25 --nostream
"@

$REMOTE_SCRIPT = $REMOTE_SCRIPT -replace "`r", ""

Write-Host "Connecting to $SERVER_IP..."
ssh -o StrictHostKeyChecking=accept-new "${SERVER_USER}@${SERVER_IP}" $REMOTE_SCRIPT
