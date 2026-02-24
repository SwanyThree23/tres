$SERVER_IP = "76.13.31.91"
$SERVER_USER = "root"

$REMOTE_SCRIPT = @"
    echo '[Server] Starting Backend API via PM2...'
    cd /var/www/swanythree/backend
    
    # Check if pm2 is installed, if not install it
    if ! command -v pm2 &> /dev/null
    then
        echo "PM2 not found. Installing nodejs & pm2..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
        npm install -g pm2
    fi

    # Activate virtual environment
    source .venv/bin/activate
    
    # Start the application using PM2. We use the uvicorn command directly.
    # Note: we must keep the path to the venv python so pm2 runs it correctly.
    pm2 start "uvicorn main:app --host 127.0.0.1 --port 8000" --name "swanythree-api" --interpreter python3
    
    pm2 save
    
    echo '[Server] PM2 Status:'
    pm2 status
"@

$REMOTE_SCRIPT = $REMOTE_SCRIPT -replace "`r", ""

Write-Host "Connecting to $SERVER_IP to start backend..."
ssh -o StrictHostKeyChecking=accept-new "${SERVER_USER}@${SERVER_IP}" $REMOTE_SCRIPT
