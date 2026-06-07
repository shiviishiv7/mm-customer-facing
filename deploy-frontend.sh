#!/bin/bash
set -e  # stop on any error
echo "=========================================="
echo "  Frontend — Deployment Start"
echo "=========================================="

# ── Config ────────────────────────────────────────────────────────────────────
EC2_PATH="/home/ec2-user/frontend"   # Nginx serves from here
BUILD_DIR="dist/student/browser"     # Angular build output

# ── Pull latest code ──────────────────────────────────────────────────────────
echo ""
echo "[1/4] Pulling latest code from main..."
git pull origin main

# ── Build ─────────────────────────────────────────────────────────────────────
echo ""
echo "[2/4] Installing dependencies and building Angular production bundle..."
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # load nvm so npm/ng are available
npm ci
npm run build:prod

# Confirm build output exists
if [ ! -d "$BUILD_DIR" ]; then
  echo "ERROR: Build output not found at $BUILD_DIR — build may have failed."
  exit 1
fi
echo "Build successful: $BUILD_DIR"

# ── Deploy to Nginx folder ────────────────────────────────────────────────────
echo ""
echo "[3/4] Copying build to /home/ec2-user/frontend..."
rm -rf $EC2_PATH
mkdir -p $EC2_PATH
cp -r $BUILD_DIR/* $EC2_PATH/

# ── Update Nginx config + Reload ──────────────────────────────────────────────
echo ""
echo "[4/4] Updating Nginx config and reloading..."
sudo cp nginx/matchmaking.conf /etc/nginx/conf.d/matchmaking.conf
sudo nginx -t
sudo systemctl reload nginx

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo "=========================================="
echo "  Deployment completed!"
echo "  Visit: https://shallweconnect.online"
echo "=========================================="
