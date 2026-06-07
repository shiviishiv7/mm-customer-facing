#!/bin/bash
set -e  # stop on any error
echo "=========================================="
echo "  Frontend — Deployment Start"
echo "=========================================="

# ── Config ────────────────────────────────────────────────────────────────────
EC2_USER="ec2-user"
EC2_IP="3.6.93.180"
EC2_PATH="/home/ec2-user/frontend"
BUILD_DIR="dist/student/browser"

# ── Pull latest code ──────────────────────────────────────────────────────────
echo ""
echo "[1/4] Pulling latest code from main..."
git pull origin main

# ── Build ─────────────────────────────────────────────────────────────────────
echo ""
echo "[2/4] Building Angular production bundle..."
npm run build:prod

# Confirm build output exists
if [ ! -d "$BUILD_DIR" ]; then
  echo "ERROR: Build output not found at $BUILD_DIR — build may have failed."
  exit 1
fi
echo "Build successful: $BUILD_DIR"

# ── Deploy to EC2 ─────────────────────────────────────────────────────────────
echo ""
echo "[3/4] Copying build to EC2..."
ssh $EC2_USER@$EC2_IP "rm -rf $EC2_PATH && mkdir -p $EC2_PATH"
scp -r $BUILD_DIR/* $EC2_USER@$EC2_IP:$EC2_PATH/

# ── Reload Nginx ──────────────────────────────────────────────────────────────
echo ""
echo "[4/4] Reloading Nginx..."
ssh $EC2_USER@$EC2_IP "sudo systemctl reload nginx"

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo "=========================================="
echo "  Deployment completed!"
echo "  Visit: https://shallweconnect.online"
echo "=========================================="
