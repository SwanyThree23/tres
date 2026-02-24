<#
.SYNOPSIS
Configures Nginx on a Hostinger VPS to route traffic directly via IP address.
#>

$SERVER_IP = "76.13.31.91"
$SERVER_USER = "root"

$NGINX_CONF = @"
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _; 

    # Serve built React frontend files
    root /var/www/swanythree/frontend/dist;
    index index.html;

    # Single-page application router fallback
    location / {
        try_files `$uri `$uri/ /index.html;
    }

    # Proxy API requests to FastAPI
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection `"upgrade`";
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
    }

    # API Documentation Fallback (Optional)
    location /docs {
        proxy_pass http://127.0.0.1:8000/docs;
    }
    
    location /openapi.json {
        proxy_pass http://127.0.0.1:8000/openapi.json;
    }
}
"@

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "🔧 Configuring Nginx on $SERVER_IP..." -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan

# Create a temporary file to hold the config
$TMP_FILE = "nginx_temp.conf"
Set-Content -Path $TMP_FILE -Value $NGINX_CONF -Force

# Upload the config file
Write-Host "`n[1/3] Uploading Nginx configuration..." -ForegroundColor Yellow
scp -o StrictHostKeyChecking=accept-new $TMP_FILE "${SERVER_USER}@${SERVER_IP}:/tmp/swanythree.conf"
if ($LASTEXITCODE -ne 0) { throw "SCP transfer failed!" }

# Remove local temp file
Remove-Item $TMP_FILE -Force

# Run SSH Commands
$REMOTE_SCRIPT = @"
    echo '[Server] Copying Nginx config into place...'
    apt-get update && apt-get install -y nginx
    
    # Remove default nginx config to prevent port 80 collisions
    rm -f /etc/nginx/sites-enabled/default
    
    # Move new config to sites-available
    cp /tmp/swanythree.conf /etc/nginx/sites-available/swanythree
    
    # Create symlink to sites-enabled
    ln -sf /etc/nginx/sites-available/swanythree /etc/nginx/sites-enabled/swanythree
    
    echo '[Server] Verifying Nginx syntax...'
    nginx -t
    
    echo '[Server] Restarting Nginx...'
    systemctl restart nginx
    
    echo '[Server] Restarting UFW / Firewall to allow Port 80 traffic... (Assuming ufw is active)'
    ufw allow 80/tcp || true
    
    echo 'Done!'
"@

# Strip Windows CRLF newlines so Linux Bash reads the commands cleanly
$REMOTE_SCRIPT = $REMOTE_SCRIPT -replace "`r", ""

Write-Host "`n[2/3] Executing Nginx setup on the remote server..." -ForegroundColor Yellow
ssh -o StrictHostKeyChecking=accept-new "${SERVER_USER}@${SERVER_IP}" $REMOTE_SCRIPT
if ($LASTEXITCODE -ne 0) { throw "Remote script execution failed!" }

Write-Host "`n✅ Nginx successfully configured and restarted!" -ForegroundColor Green
Write-Host "You should now be able to access the SwanyThree platform at: http://$SERVER_IP/" -ForegroundColor Cyan
