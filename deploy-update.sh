#!/usr/bin/env bash
#
# deploy-update.sh - Manual deploy script for Speedler
#
# Run this directly on the Hostinger VPS to pull the latest code
# and rebuild the app container.
#
# Usage:
#   cd /docker/speedler && bash deploy-update.sh
#

set -euo pipefail

echo "==> Pulling latest code from GitHub..."
git pull origin main

echo "==> Rebuilding app container..."
docker compose build app

echo "==> Restarting app container..."
docker compose up -d app

echo "==> Cleaning up old images..."
docker image prune -f

echo "==> Deploy complete!"
docker compose ps app
