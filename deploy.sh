#!/usr/bin/env bash
set -e

echo "=== Deploying Presentation Voting App ==="

# 1. Pull latest code
if [ -d ".git" ]; then
  echo "Pulling latest code from git..."
  git pull
fi

# 2. Install dependencies
echo "Installing dependencies..."
npm install

# 3. Build frontend bundle
echo "Building client assets..."
npm run build

# 4. Restart process if running under PM2 or systemd
if command -v pm2 &> /dev/null && pm2 describe students-voting-app &> /dev/null; then
  echo "Restarting PM2 process..."
  pm2 restart students-voting-app
elif command -v systemctl &> /dev/null && systemctl is-active --quiet voting-app; then
  echo "Restarting systemd service..."
  sudo systemctl restart voting-app
else
  echo "Deployment ready. You can start the server with: npm run serve"
fi

echo "=== Deployment finished successfully ==="
